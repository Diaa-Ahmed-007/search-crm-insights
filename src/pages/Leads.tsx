import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { z } from 'zod';

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  source: string | null;
  status: string | null;
  notes: string | null;
  unit_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  units?: { unit_number: string; areas?: { name: string; projects?: { name: string } | null } | null } | null;
}

interface Unit {
  id: string;
  unit_number: string;
  areas?: { name: string; projects?: { name: string } | null } | null;
}

const leadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email').max(255).optional().or(z.literal('')),
  phone: z.string().min(5, 'Phone is required').max(20),
  source: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
});

export default function Leads() {
  const { role, user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'assigned' | 'created'>('all');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: '',
    status: 'new',
    notes: '',
    unit_id: '',
  });

  const fetchData = async () => {
    setIsLoading(true);
    const [leadsRes, unitsRes] = await Promise.all([
      supabase.from('leads').select('*, units(unit_number, areas(name, projects(name)))').order('created_at', { ascending: false }),
      supabase.from('units').select('id, unit_number, areas(name, projects(name))'),
    ]);

    if (leadsRes.error) toast.error('Failed to fetch leads');
    if (unitsRes.error) toast.error('Failed to fetch units');

    setLeads(leadsRes.data || []);
    setUnits(unitsRes.data || []);
    setIsLoading(false);
  };

  // Filter leads based on filter mode
  const filteredLeads = leads.filter((lead) => {
    if (filterMode === 'all') return true;
    if (filterMode === 'assigned') return lead.assigned_to === user?.id;
    if (filterMode === 'created') return lead.created_by === user?.id;
    return true;
  });

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', source: '', status: 'new', notes: '', unit_id: '' });
    setEditingLead(null);
  };

  const handleSubmit = async () => {
    const validation = leadSchema.safeParse(formData);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    try {
      const leadData = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone,
        source: formData.source || null,
        status: formData.status,
        notes: formData.notes || null,
        unit_id: formData.unit_id || null,
      };

      if (editingLead) {
        const { error } = await supabase.from('leads').update(leadData).eq('id', editingLead.id);
        if (error) throw error;
        toast.success('Lead updated successfully');
      } else {
        const { error } = await supabase.from('leads').insert({
          ...leadData,
          created_by: user?.id,
          assigned_to: user?.id,
        });
        if (error) throw error;
        toast.success('Lead created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete lead');
    } else {
      toast.success('Lead deleted successfully');
      fetchData();
    }
  };

  const openEditDialog = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone,
      source: lead.source || '',
      status: lead.status || 'new',
      notes: lead.notes || '',
      unit_id: lead.unit_id || '',
    });
    setIsDialogOpen(true);
  };

  const isAdmin = role === 'admin';

  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    qualified: 'bg-purple-100 text-purple-800',
    converted: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Leads</h1>
            <p className="text-muted-foreground">Manage your customer leads</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterMode} onValueChange={(value: 'all' | 'assigned' | 'created') => setFilterMode(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter leads" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leads</SelectItem>
                <SelectItem value="assigned">Assigned to Me</SelectItem>
                <SelectItem value="created">Created by Me</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingLead ? 'Edit Lead' : 'Create New Lead'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter phone"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="source">Source</Label>
                    <Input
                      id="source"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      placeholder="e.g., Website"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Interested Unit</Label>
                  <Select
                    value={formData.unit_id}
                    onValueChange={(value) => setFormData({ ...formData, unit_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.areas?.projects?.name} / {unit.areas?.name} - {unit.unit_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add notes..."
                    rows={3}
                  />
                </div>
                <Button className="w-full" onClick={handleSubmit}>
                  {editingLead ? 'Update Lead' : 'Create Lead'}
                </Button>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No leads found
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{lead.phone}</p>
                        {lead.email && <p className="text-muted-foreground">{lead.email}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{lead.source || '-'}</TableCell>
                    <TableCell>
                      {lead.units ? (
                        <span className="text-sm">
                          {lead.units.areas?.projects?.name} - {lead.units.unit_number}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusColors[lead.status || 'new']
                        }`}
                      >
                        {lead.status}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(lead)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {isAdmin && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(lead.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
