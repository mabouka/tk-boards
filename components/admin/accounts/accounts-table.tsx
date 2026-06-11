'use client'

import { useState, useTransition } from 'react'
import { fmtDate } from '@/lib/admin/format'
import Link from 'next/link'
import { toast } from 'sonner'
import { MoreHorizontal, Search } from 'lucide-react'
import { setRole } from '@/app/admin/(app)/accounts/actions'
import type { AccountRow } from '@/lib/admin/accounts'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card } from '@/components/admin/ui/card'
import { Input } from '@/components/admin/ui/input'
import { Avatar, AvatarFallback } from '@/components/admin/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/admin/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/admin/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/admin/ui/table'

const initials = (name: string, email: string) => {
  const base = name && name !== '—' ? name : email
  return base
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

type RoleFilter = 'all' | 'customer' | 'admin'

export function AccountsTable({
  accounts,
  currentUserId,
}: {
  accounts: AccountRow[]
  currentUserId: string
}) {
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [pending, startTransition] = useTransition()

  const needle = q.trim().toLowerCase()
  const filtered = accounts.filter(
    (a) =>
      (roleFilter === 'all' || a.role === roleFilter) &&
      (needle === '' ||
        a.name.toLowerCase().includes(needle) ||
        a.email.toLowerCase().includes(needle))
  )

  function changeRole(id: string, role: 'customer' | 'admin') {
    startTransition(async () => {
      const res = await setRole(id, role)
      if (res.ok) toast.success('Rôle mis à jour.')
      else toast.error(res.error)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher nom ou email…"
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="customer">Clients</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Compte</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Méthode</TableHead>
              <TableHead>Inscrit le</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-10 text-center text-sm">
                  Aucun compte.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((a) => {
                const isMe = a.id === currentUserId
                const isAdmin = a.role === 'admin'
                return (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">
                            {initials(a.name, a.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 font-medium">
                            <Link href={`/admin/accounts/${a.id}`} className="hover:underline">
                              {a.name}
                            </Link>
                            {isMe && <span className="text-muted-foreground text-xs">(vous)</span>}
                          </div>
                          <div className="text-muted-foreground truncate text-xs">{a.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isAdmin ? 'default' : 'secondary'}>
                        {isAdmin ? 'Admin' : 'Client'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {a.method === 'password' ? 'Mot de passe' : 'Google'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {fmtDate(a.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isMe || pending}>
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isAdmin ? (
                            <DropdownMenuItem onClick={() => changeRole(a.id, 'customer')}>
                              Rétrograder en client
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => changeRole(a.id, 'admin')}>
                              Promouvoir admin
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
