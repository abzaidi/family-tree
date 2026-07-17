'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Plus, TreePine } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

import { I18nProvider } from '@/lib/i18n/context';
import { useI18n } from '@/lib/i18n/context';
import { Navbar } from '@/components/nav/Navbar';
import { SearchCommand } from '@/components/nav/SearchCommand';
import { PersonDrawer } from '@/components/panels/PersonDrawer';
import { AddPersonModal } from '@/components/panels/AddPersonModal';
import { EditPersonModal } from '@/components/panels/EditPersonModal';
import { DeleteConfirmDialog } from '@/components/panels/DeleteConfirmDialog';
import { usePersons } from '@/hooks/usePersons';
import { useUnions } from '@/hooks/useUnions';
import { useAuth } from '@/hooks/useAuth';
import { useTreeStore } from '@/store/tree-store';
import type { Person, PersonFormData } from '@/types';

// Dynamic import for React Flow canvas to avoid SSR issues
const FamilyCanvas = dynamic(
  () => import('@/components/tree/FamilyCanvas'),
  { ssr: false }
);

function TreeApp() {
  const { t } = useI18n();
  const { loading: authLoading, canEdit } = useAuth();
  const { fetchAll, createPerson, editPerson, softDeleteBranch, getDescendantCount, setRootPerson } =
    usePersons();
  const { createUnion, addChildToUnion, getUnionsForPerson } = useUnions();
  const { persons, rootPersonId, expandNode } = useTreeStore();

  // Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'child' | 'spouse' | 'parent' | 'root'>('root');
  const [targetPerson, setTargetPerson] = useState<Person | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Person | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null);
  const [deleteDescendantCount, setDeleteDescendantCount] = useState(0);

  // Fetch data on mount
  useEffect(() => {
    if (!authLoading) {
      fetchAll();
    }
  }, [authLoading, fetchAll]);

  // Auto-expand root person on first load
  useEffect(() => {
    if (rootPersonId) {
      expandNode(rootPersonId);
    }
  }, [rootPersonId, expandNode]);

  // Handlers
  const handleAddChild = useCallback((person: Person) => {
    setTargetPerson(person);
    setAddMode('child');
    setAddModalOpen(true);
  }, []);

  const handleAddSpouse = useCallback((person: Person) => {
    setTargetPerson(person);
    setAddMode('spouse');
    setAddModalOpen(true);
  }, []);

  const handleAddParent = useCallback((person: Person) => {
    setTargetPerson(person);
    setAddMode('parent');
    setAddModalOpen(true);
  }, []);

  const handleEdit = useCallback((person: Person) => {
    setEditTarget(person);
    setEditModalOpen(true);
  }, []);

  const handleDelete = useCallback(
    (person: Person) => {
      const count = getDescendantCount(person.id);
      setDeleteTarget(person);
      setDeleteDescendantCount(count);
      setDeleteDialogOpen(true);
    },
    [getDescendantCount]
  );

  const handleAddSubmit = useCallback(
    async (data: PersonFormData, mode: string, selectedUnionId?: string) => {
      const newPerson = await createPerson(data);
      if (!newPerson) return;

      if (mode === 'root') {
        await setRootPerson(newPerson.id);
        expandNode(newPerson.id);
        toast.success(t('toast.added'));
        return;
      }

      if (!targetPerson) return;

      if (mode === 'child') {
        let unionId = selectedUnionId;
        if (!unionId) {
          // Get first union or create a single-parent union
          const unions = getUnionsForPerson(targetPerson.id);
          if (unions.length > 0) {
            unionId = unions[0].id;
          } else {
            const union = await createUnion(targetPerson.id, null);
            if (!union) return;
            unionId = union.id;
          }
        }
        await addChildToUnion(unionId, newPerson.id);
        expandNode(targetPerson.id);
      } else if (mode === 'spouse') {
        await createUnion(targetPerson.id, newPerson.id);
        expandNode(targetPerson.id);
      } else if (mode === 'parent') {
        // Create a union for the new parent and add targetPerson as child
        const union = await createUnion(newPerson.id, null);
        if (union) {
          await addChildToUnion(union.id, targetPerson.id);
          expandNode(newPerson.id);
        }
      }

      toast.success(t('toast.added'));
    },
    [
      createPerson,
      setRootPerson,
      targetPerson,
      createUnion,
      addChildToUnion,
      getUnionsForPerson,
      expandNode,
      t,
    ]
  );

  const handleEditSubmit = useCallback(
    async (id: string, data: Partial<PersonFormData>) => {
      return await editPerson(id, data);
    },
    [editPerson]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    const success = await softDeleteBranch(deleteTarget.id);
    if (success) {
      toast.success(t('toast.deleted'));
      useTreeStore.getState().setDrawerOpen(false);
    }
  }, [deleteTarget, softDeleteBranch, t]);

  const handleFitScreen = useCallback(() => {
    // This will be handled through a custom event
    window.dispatchEvent(new CustomEvent('fit-screen'));
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center animate-pulse">
            <TreePine className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-gray-400">{t('state.loading')}</p>
        </motion.div>
      </div>
    );
  }

  const hasRoot = rootPersonId && persons.some((p) => p.id === rootPersonId && !p.deleted);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar onFitScreen={handleFitScreen} />

      <main className="flex-1 relative mt-14">
        {hasRoot ? (
          <FamilyCanvas />
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50/50">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto mb-5">
                <TreePine className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {t('state.empty')}
              </h2>
              <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
                Start by adding the root person of your family tree
              </p>
              {canEdit && (
                <Button
                  onClick={() => {
                    setTargetPerson(null);
                    setAddMode('root');
                    setAddModalOpen(true);
                  }}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('action.addRoot')}
                </Button>
              )}
            </motion.div>
          </div>
        )}

        {/* Floating add button */}
        {hasRoot && canEdit && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-48 right-6 z-40"
          >
            <Button
              size="lg"
              className="rounded-full w-14 h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-200"
              onClick={() => {
                setTargetPerson(null);
                setAddMode('root');
                setAddModalOpen(true);
              }}
              aria-label={t('action.addPerson')}
            >
              <Plus className="w-6 h-6" />
            </Button>
          </motion.div>
        )}
      </main>

      {/* Panels & Modals */}
      <PersonDrawer
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddChild={handleAddChild}
        onAddSpouse={handleAddSpouse}
        onAddParent={handleAddParent}
      />
      <SearchCommand />
      <AddPersonModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        mode={addMode}
        targetPerson={targetPerson}
        onSubmit={handleAddSubmit}
      />
      <EditPersonModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        person={editTarget}
        onSubmit={handleEditSubmit}
      />
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        person={deleteTarget}
        descendantCount={deleteDescendantCount}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <I18nProvider>
      <TooltipProvider>
        <TreeApp />
        <Toaster
          position="bottom-center"
          toastOptions={{
            className: 'font-sans',
            style: {
              borderRadius: '12px',
            },
          }}
        />
      </TooltipProvider>
    </I18nProvider>
  );
}
