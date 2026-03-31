import {
  LayoutDashboard, ShoppingCart, FlameKindling, UtensilsCrossed,
  Ruler, ChefHat, Receipt, BarChart3, Settings, Users, Package
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Insumos e Compras", url: "/ingredients", icon: ShoppingCart },
  { title: "Rendimento", url: "/yield", icon: FlameKindling },
  { title: "Componentes", url: "/components", icon: UtensilsCrossed },
  { title: "Tamanhos de Prato", url: "/plate-sizes", icon: Ruler },
  { title: "Pratos", url: "/plates", icon: ChefHat },
  { title: "Custos Extras", url: "/extra-costs", icon: Receipt },
  { title: "Clientes", url: "/customers", icon: Users },
  { title: "Pedidos", url: "/orders", icon: Package },
  { title: "Relatórios", url: "/reports", icon: BarChart3 },
  { title: "Configurações", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center gap-2">
          <ChefHat className="h-7 w-7 text-sidebar-primary" />
          {!collapsed && (
            <span className="font-display text-lg font-bold text-sidebar-foreground">
              PrecifiChef
            </span>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
