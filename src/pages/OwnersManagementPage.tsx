import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Owner } from '@/types';
import { OwnersTable } from '@/components/owners/OwnersTable';
import { OwnersFilter } from '@/components/owners/OwnersFilter';
import { OwnerFormModal } from '@/components/owners/OwnerFormModal';
import { DeleteConfirmModal } from '@/components/owners/DeleteConfirmModal';

interface FilterOptions {
  search: string;
  temperature: 'ALL' | 'HOT' | 'WARM' | 'COLD';
  scoreMin: number;
  scoreMax: number;
}

export function OwnersListPage() {
  const { user, organization } = useAuth();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [filteredOwners, setFilteredOwners] = useState<Owner[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    temperature: 'ALL',
    scoreMin: 0,
    scoreMax: 100,
  });

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [ownersToDelete, setOwnersToDelete] = useState<Owner[]>([]);

  // Load owners from Supabase
  const loadOwners = useCallback(async () => {
    if (!organization?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('owners')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOwners(data || []);
    } catch (error) {
      console.error('Error loading owners:', error);
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  // Apply filters
  useEffect(() => {
    let filtered = owners;

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.firstName?.toLowerCase().includes(search) ||
          o.lastName?.toLowerCase().includes(search) ||
          o.email?.toLowerCase().includes(search) ||
          o.phone?.includes(search)
      );
    }

    // Temperature filter
    if (filters.temperature !== 'ALL') {
      filtered = filtered.filter((o) => o.temperature === filters.temperature);
    }

    // Score range filter
    filtered = filtered.filter(
      (o) => o.score >= filters.scoreMin && o.score <= filters.scoreMax
    );

    setFilteredOwners(filtered);
  }, [owners, filters]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!organization?.id) return;

    const subscription = supabase
      .channel(`owners:${organization.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'owners',
          filter: `organization_id=eq.${organization.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOwners((prev) => [payload.new as Owner, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOwners((prev) =>
              prev.map((o) => (o.id === payload.new.id ? (payload.new as Owner) : o))
            );
          } else if (payload.eventType === 'DELETE') {
            setOwners((prev) => prev.filter((o) => o.id !== payload.old.id));
            setSelectedIds((prev) => {
              const newSet = new Set(prev);
              newSet.delete(payload.old.id);
              return newSet;
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [organization?.id]);

  // Initial load
  useEffect(() => {
    loadOwners();
  }, [loadOwners]);

  // Handle edit owner
  const handleEditOwner = (owner: Owner) => {
    setSelectedOwner(owner);
    setFormModalOpen(true);
  };

  // Handle delete owner(s)
  const handleDeleteOwner = (owners: Owner[]) => {
    setOwnersToDelete(owners);
    setDeleteModalOpen(true);
  };

  const handleBulkDelete = (ids: string[]) => {
    const toDelete = owners.filter((o) => ids.includes(o.id));
    handleDeleteOwner(toDelete);
  };

  // Handle form submission
  const handleSaveOwner = async (ownerData: Omit<Owner, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      if (selectedOwner) {
        // Update existing
        const { error } = await supabase
          .from('owners')
          .update(ownerData)
          .eq('id', selectedOwner.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase.from('owners').insert([
          {
            ...ownerData,
            organization_id: organization?.id,
          },
        ]);

        if (error) throw error;
      }
      setFormModalOpen(false);
      setSelectedOwner(null);
      await loadOwners();
    } catch (error) {
      console.error('Error saving owner:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      const ids = ownersToDelete.map((o) => o.id);

      const { error } = await supabase
        .from('owners')
        .delete()
        .in('id', ids);

      if (error) throw error;

      setDeleteModalOpen(false);
      setOwnersToDelete([]);
      setSelectedIds(new Set());
      await loadOwners();
    } catch (error) {
      console.error('Error deleting owners:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredOwners.map((o) => o.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  return (
    <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Proprietari</h1>
            <p className="text-gray-600 mt-2">Gestisci i tuoi proprietari</p>
          </div>
          <Button onClick={() => setFormModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nuovo Proprietario
          </Button>
        </div>

        {/* Filter */}
        <OwnersFilter filters={filters} onFiltersChange={setFilters} />

        {/* Table */}
        <OwnersTable
          owners={filteredOwners}
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectOne={handleSelectOne}
          onEdit={handleEditOwner}
          onDelete={handleDeleteOwner}
          onBulkDelete={handleBulkDelete}
          loading={loading}
        />

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm">Totale Proprietari</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{owners.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm">Caldi</p>
            <p className="text-2xl font-bold text-red-600 mt-2">
              {owners.filter((o) => o.temperature === 'HOT').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm">Tiepidi</p>
            <p className="text-2xl font-bold text-orange-600 mt-2">
              {owners.filter((o) => o.temperature === 'WARM').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm">Freddi</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {owners.filter((o) => o.temperature === 'COLD').length}
            </p>
          </div>
        </div>

      {/* Form Modal */}
      <OwnerFormModal
        owner={selectedOwner || undefined}
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setSelectedOwner(null);
        }}
        onSave={handleSaveOwner}
        loading={loading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title={`Elimina ${ownersToDelete.length} proprietario(i)?`}
        message={
          ownersToDelete.length === 1
            ? `Sei sicuro di voler eliminare ${ownersToDelete[0]?.firstName} ${ownersToDelete[0]?.lastName}? Questa azione non può essere annullata.`
            : `Sei sicuro di voler eliminare ${ownersToDelete.length} proprietari? Questa azione non può essere annullata.`
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setOwnersToDelete([]);
        }}
        loading={loading}
        isDangerous
      />
    </div>
  );
}
