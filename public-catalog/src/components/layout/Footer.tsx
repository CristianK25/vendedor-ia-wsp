import { Share2, Globe, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-surface-container w-full py-24 border-t border-outline-variant/30 mt-12">
      <div className="max-w-container-max mx-auto px-8 md:px-margin-page grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="space-y-6">
          <div className="font-display-lg text-headline-md text-on-surface">
            LVM AUTOMOTORES
          </div>
          <p className="font-body-md text-on-surface-variant">
            Av. del Libertador 1500, CABA<br />
            Buenos Aires, Argentina
          </p>
        </div>
        
        <div className="space-y-6">
          <h4 className="font-label-sm text-label-sm uppercase tracking-widest text-primary">
            Horarios
          </h4>
          <p className="font-body-md text-on-surface-variant">
            Lunes a Viernes de 9 a 18hs<br />
            Sábados de 10 a 14hs
          </p>
        </div>
        
        <div className="space-y-6">
          <h4 className="font-label-sm text-label-sm uppercase tracking-widest text-primary">
            Seguinos
          </h4>
          <div className="flex gap-4">
            {/* 
              TODO (Interactividad Faltante):
              Falta colocar los enlaces (href) reales a las redes sociales de LVM Automotores.
            */}
            <a href="#" className="text-on-surface-variant hover:text-primary cursor-pointer transition-colors">
              <Share2 size={24} strokeWidth={1.5} />
            </a>
            <a href="#" className="text-on-surface-variant hover:text-primary cursor-pointer transition-colors">
              <Globe size={24} strokeWidth={1.5} />
            </a>
            <a href="#" className="text-on-surface-variant hover:text-primary cursor-pointer transition-colors">
              <Mail size={24} strokeWidth={1.5} />
            </a>
          </div>
          <a className="block font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors mt-4" href="#">
            Términos y Condiciones
          </a>
        </div>
      </div>
      
      <div className="max-w-container-max mx-auto px-8 md:px-margin-page mt-16 pt-8 border-t border-outline-variant/30 text-center">
        <p className="font-label-sm text-label-sm uppercase tracking-widest text-outline">
          © {new Date().getFullYear()} LVM AUTOMOTORES. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
