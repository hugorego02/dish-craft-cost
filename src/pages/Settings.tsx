import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCurrency, type CurrencyCode } from "@/contexts/CurrencyContext";
import { toast } from "sonner";

export default function SettingsPage() {
  const { currency, setCurrency } = useCurrency();

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
        <CardHeader><CardTitle className="font-display">Moeda</CardTitle></CardHeader>
        <CardContent>
          <div className="max-w-xs space-y-2">
            <Label>Moeda de exibição</Label>
            <Select value={currency} onValueChange={(v) => { setCurrency(v as CurrencyCode); toast.success("Moeda atualizada"); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">R$ — Real Brasileiro (BRL)</SelectItem>
                <SelectItem value="USD">$ — Dólar Americano (USD)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              A moeda selecionada será usada em todas as telas do sistema.
            </p>
          </div>
        </CardContent>
      </Card>

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
