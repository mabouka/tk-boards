'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, Boxes, Nfc, Users, FileText, ShieldAlert } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/admin/ui/sidebar'

type NavItem = { title: string; href: string; icon: React.ComponentType<{ className?: string }> }
type NavGroup = { label: string | null; items: NavItem[] }

const NAV: NavGroup[] = [
  { label: null, items: [{ title: 'Tableau de bord', href: '/admin', icon: LayoutDashboard }] },
  {
    label: 'Catalogue',
    items: [
      { title: 'Produits', href: '/admin/products', icon: Package },
      { title: 'Stock', href: '/admin/stock', icon: Boxes },
    ],
  },
  { label: 'Production', items: [{ title: 'Registre NFC', href: '/admin/units', icon: Nfc }] },
  {
    label: 'Clients',
    items: [
      { title: 'Comptes', href: '/admin/accounts', icon: Users },
      { title: 'Réclamations', href: '/admin/claims', icon: FileText },
      { title: 'Vol', href: '/admin/theft', icon: ShieldAlert },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-3">
        <Link href="/admin" className="text-lg font-semibold tracking-tight">
          TK <span className="text-muted-foreground font-normal">Admin</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {NAV.map((group, i) => (
          <SidebarGroup key={i}>
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.title}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
