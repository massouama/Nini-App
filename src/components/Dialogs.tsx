import { createContext, useContext, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientDialog } from './ClientDialog';
import { GeneratorDialog } from './GeneratorDialog';
import { useToast } from './ui/Toasts';

interface DialogsApi {
  openClient: (id?: string | null) => void;
  openGenerator: (clientIds: string[]) => void;
}
const Ctx = createContext<DialogsApi>({ openClient: () => {}, openGenerator: () => {} });
export const useDialogs = () => useContext(Ctx);

/** Fenêtres partagées par toutes les pages (dossier, générateur d'échéances). */
export function DialogsProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [client, setClient] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [gen, setGen] = useState<{ open: boolean; ids: string[] }>({ open: false, ids: [] });
  const api: DialogsApi = {
    openClient: (id = null) => setClient({ open: true, id }),
    openGenerator: ids => setGen({ open: true, ids }),
  };
  return (
    <Ctx.Provider value={api}>
      {children}
      <ClientDialog
        open={client.open}
        clientId={client.id}
        onClose={() => setClient(s => ({ ...s, open: false }))}
        onCreated={c => {
          toast('Dossier créé');
          navigate(`/dossiers/${c.id}`);
          setGen({ open: true, ids: [c.id] });
        }}
      />
      <GeneratorDialog open={gen.open} clientIds={gen.ids} onClose={() => setGen(s => ({ ...s, open: false }))} />
    </Ctx.Provider>
  );
}
