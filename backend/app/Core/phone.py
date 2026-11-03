import re
from fastapi import HTTPException, status

def sanitizar_telefono(telefono: str) -> str:
    """
    Normaliza el número de teléfono al formato estándar internacional de WhatsApp.
    Para Argentina: 549 + 10 dígitos (ej: 5492614720339).
    Acepta formatos como:
      - +54 9 261 472-0339 -> 5492614720339
      - 542614720339 -> 5492614720339
      - 0261 154720339 -> 5492614720339
      - 2614720339 -> 5492614720339
      - 5492614720339 -> 5492614720339
    """
    if not telefono:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El teléfono no puede estar vacío"
        )

    # Quitar posibles prefijos de expresiones n8n (ej: ={{...}}) y dejar solo dígitos
    raw = str(telefono).lstrip("=").strip()
    limpio = re.sub(r"\D", "", raw)

    if not limpio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El número de teléfono es inválido"
        )

    # Si empieza con 549 y tiene 13 dígitos, está perfecto
    if limpio.startswith("549") and len(limpio) == 13:
        return limpio

    # Si empieza con 54 (sin 9) y tiene 12 dígitos (ej: 542614720339) -> 5492614720339
    if limpio.startswith("54") and len(limpio) == 12:
        return f"549{limpio[2:]}"

    # Si empieza con 0 (ej: 0261...)
    if limpio.startswith("0"):
        limpio = limpio[1:]

    # Si tras quitar el 0 quedan 10 dígitos (ej: 2614720339), anteponemos 549
    if len(limpio) == 10:
        return f"549{limpio}"

    # Si tiene 12 dígitos y contiene '15' tras código de área de 2, 3 o 4 dígitos (ej: 261154720339)
    for area_len in [2, 3, 4]:
        if len(limpio) == 12 and limpio[area_len:area_len + 2] == "15":
            sin_15 = limpio[:area_len] + limpio[area_len + 2:]
            if len(sin_15) == 10:
                return f"549{sin_15}"

    # Si ya tiene entre 10 y 15 dígitos
    if 10 <= len(limpio) <= 15:
        if len(limpio) == 10:
            return f"549{limpio}"
        return limpio

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="El formato del teléfono no es válido. Debe tener entre 10 y 15 dígitos."
    )


def sanitizar_nombre(nombre: str | None, max_len: int = 100) -> str | None:
    """
    Sanea nombres de clientes (viniendo de perfiles de WhatsApp o formularios).
    Elimina saltos de línea y caracteres de control para evitar inyecciones en prompts.
    """
    if not nombre:
        return None
    limpio = str(nombre).lstrip("=").strip()
    if not limpio or limpio.lower() in {"null", "none", "n/a", "undefined"}:
        return None
    # Reemplazar saltos de línea y tabs por espacios
    limpio = re.sub(r"[\r\n\t]+", " ", limpio)
    # Colapsar espacios múltiples
    limpio = re.sub(r"\s+", " ", limpio).strip()
    return limpio[:max_len] if limpio else None

