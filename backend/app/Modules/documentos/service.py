import os
import uuid
import shutil
from typing import List
from fastapi import UploadFile, HTTPException, status
from sqlmodel import Session, select
from app.Modules.documentos.model import DocumentoVehiculo, TipoDocumento
from app.Modules.vehiculos.model import EtapaVehiculo

from datetime import datetime

UPLOAD_DIR = "documentos"

class DocumentosService:
    def __init__(self, session: Session):
        self.session = session
        
        # Ensure upload dir exists
        if not os.path.exists(UPLOAD_DIR):
            os.makedirs(UPLOAD_DIR)

    def get_documentos_by_vehiculo(self, vehiculo_id: int) -> List[DocumentoVehiculo]:
        statement = select(DocumentoVehiculo).where(DocumentoVehiculo.vehiculo_id == vehiculo_id)
        return self.session.exec(statement).all()

    async def subir_documento(
        self, 
        vehiculo_id: int, 
        etapa: EtapaVehiculo, 
        tipo_documento: TipoDocumento, 
        file: UploadFile
    ) -> DocumentoVehiculo:
        if not file.filename:
            raise HTTPException(status_code=400, detail="El archivo no tiene nombre")
            
        extension = os.path.splitext(file.filename)[1].lower()
        if extension != ".pdf":
            raise HTTPException(status_code=400, detail="Solo se admiten documentos en formato PDF (.pdf)")
            
        if file.content_type and file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Solo se admiten documentos en formato PDF (.pdf)")
            
        # Check if this type of document already exists for this vehicle
        statement = select(DocumentoVehiculo).where(
            DocumentoVehiculo.vehiculo_id == vehiculo_id,
            DocumentoVehiculo.tipo_documento == tipo_documento
        )
        doc_existente = self.session.exec(statement).first()
        
        uuid_corto = uuid.uuid4().hex[:6]
        
        if doc_existente:
            nueva_version = (doc_existente.version or 1) + 1
            filename = f"{vehiculo_id}_{etapa.value}_{tipo_documento.value}_v{nueva_version}_{uuid_corto}{extension}"
            
            # Update record (without deleting old physical file)
            doc_existente.ruta_archivo = f"/documentos/{filename}"
            doc_existente.nombre_original = file.filename
            doc_existente.version = nueva_version
            doc_existente.fecha_subida = datetime.utcnow()
            documento_bd = doc_existente
        else:
            version = 1
            filename = f"{vehiculo_id}_{etapa.value}_{tipo_documento.value}_v{version}_{uuid_corto}{extension}"
            # Create new record
            documento_bd = DocumentoVehiculo(
                vehiculo_id=vehiculo_id,
                etapa=etapa,
                tipo_documento=tipo_documento,
                ruta_archivo=f"/documentos/{filename}",
                nombre_original=file.filename,
                version=version
            )
        
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        # Save physical file
        try:
            with open(filepath, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al guardar el archivo en disco: {str(e)}")
            
        # Save to DB
        self.session.add(documento_bd)
        self.session.commit()
        self.session.refresh(documento_bd)
        
        # --- Avance de Etapa Automático ---
        from app.Modules.vehiculos.model import Vehiculo
        vehiculo = self.session.get(Vehiculo, vehiculo_id)
        if vehiculo:
            # Iteramos para avanzar etapa si los requisitos se van cumpliendo
            while True:
                if self.tiene_requisitos_completos(vehiculo_id, vehiculo.etapa):
                    siguiente_etapa = None
                    if vehiculo.etapa == EtapaVehiculo.pre_compra:
                        siguiente_etapa = EtapaVehiculo.comprado
                    elif vehiculo.etapa == EtapaVehiculo.comprado:
                        siguiente_etapa = EtapaVehiculo.en_stock
                    
                    if siguiente_etapa:
                        vehiculo.etapa = siguiente_etapa
                        self.session.add(vehiculo)
                        self.session.commit()
                        self.session.refresh(vehiculo)
                    else:
                        break # Ya está en la última etapa
                else:
                    break # No cumple los requisitos para avanzar más
                    
        return documento_bd

    def tiene_requisitos_completos(self, vehiculo_id: int, etapa: EtapaVehiculo) -> bool:
        """
        Devuelve True si todos los documentos obligatorios de la etapa están cargados.
        No lanza excepciones. Usado para el avance automático silencioso.
        """
        requisitos = {
            EtapaVehiculo.pre_compra: [TipoDocumento.informe_dominio, TipoDocumento.deuda_patentes],
            EtapaVehiculo.comprado: [TipoDocumento.boleto_compra, TipoDocumento.dni_vendedor, TipoDocumento.formulario_08, TipoDocumento.cedula_vehiculo],
            EtapaVehiculo.en_stock: [], 
            EtapaVehiculo.vendido: [TipoDocumento.boleto_venta, TipoDocumento.verificacion_policial, TipoDocumento.dni_comprador, TipoDocumento.formulario_08_12] 
        }
        
        docs_requeridos = requisitos.get(etapa, [])
        if not docs_requeridos:
            return True
            
        statement = select(DocumentoVehiculo.tipo_documento).where(
            DocumentoVehiculo.vehiculo_id == vehiculo_id,
            DocumentoVehiculo.etapa == etapa
        )
        docs_subidos = self.session.exec(statement).all()
        
        return all(doc in docs_subidos for doc in docs_requeridos)
