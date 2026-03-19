import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SettingsPage() {
  const handleClear = () => {
    if (confirm("Tem certeza? Isso apagará todos os dados.")) {
      localStorage.removeItem('mealprep-pricing-data');
      window.location.reload();
    }
  };

  const handleExport = () => {
    const data = localStorage.getItem('mealprep-pricing-data');
    if (!data) { toast.error("Nenhum dado para exportar"); return; }
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'precifichef-backup.json'; a.click();
    URL.revokeObjectURL(url);
    toast.success("Dados exportados");
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        JSON.parse(text);
        localStorage.setItem('mealprep-pricing-data', text);
        window.location.reload();
      } catch { toast.error("Arquivo inválido"); }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Configurações</h1>
        <p className="text-muted-foreground mt-1">Preferências gerais do sistema</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="font-display">Dados</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleExport}>Exportar dados (JSON)</Button>
            <Button variant="outline" onClick={handleImport}>Importar dados</Button>
          </div>
          <div className="border-t pt-3">
            <Button variant="destructive" onClick={handleClear}>Limpar todos os dados</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display">Sobre</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            PrecifiChef — Sistema de precificação inteligente para marmitas e meal prep.
            Calcule custos reais com fator de rendimento, monte pratos personalizáveis
            e saiba exatamente quanto cobrar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
