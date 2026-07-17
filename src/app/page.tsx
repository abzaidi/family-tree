'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Plus, TreePine } from 'lucide-react';
import { toast } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

import { I18nProvider } from '@/lib/i18n/context';
import { useI18n } from '@/lib/i18n/context';
import { Navbar } from '@/components/nav/Navbar';
import { SearchCommand } from '@/components/nav/SearchCommand';
import { PersonDrawer } from '@/components/panels/PersonDrawer';
import { AddPersonModal } from '@/components/panels/AddPersonModal';
import { EditPersonModal } from '@/components/panels/EditPersonModal';
import {
  DeleteConfirmDialog,
  type DeleteChoice,
} from '@/components/panels/DeleteConfirmDialog';
import { ExportLanguageDialog } from '@/components/panels/ExportLanguageDialog';
import { ThemeToaster } from '@/components/theme/theme-toaster';
import { usePersons } from '@/hooks/usePersons';
import { useUnions } from '@/hooks/useUnions';
import { useAuth } from '@/hooks/useAuth';
import { useTreeStore } from '@/store/tree-store';
import type { DeleteContext, Person, PersonFormData } from '@/types';

// Dynamic import for React Flow canvas to avoid SSR issues
const FamilyCanvas = dynamic(
  () => import('@/components/tree/FamilyCanvas'),
  { ssr: false }
);

function TreeApp() {
  const { t } = useI18n();
  const { loading: authLoading, canEdit } = useAuth();
  const {
    fetchAll,
    createPerson,
    editPerson,
    softDeleteBranch,
    deletePersonOnly,
    insertPersonInMiddle,
    getDeleteContext,
    setRootPerson,
  } = usePersons();
  const { createUnion, createSpouseUnion, addChildToUnion, getUnionsForPerson } = useUnions();
  const { persons, rootPersonId, expandNode } = useTreeStore();

  // Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'child' | 'spouse' | 'root' | 'insert'>('root');
  const [targetPerson, setTargetPerson] = useState<Person | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Person | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null);
  const [deleteContext, setDeleteContext] = useState<DeleteContext | null>(null);

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportTarget, setExportTarget] = useState<Person | null>(null);

  // Data-loading state prevents the empty "add root" screen from flashing
  // before the tree data arrives
  const [dataLoading, setDataLoading] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    if (!authLoading) {
      fetchAll().finally(() => setDataLoading(false));
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

  const handleInsertPerson = useCallback(() => {
    setTargetPerson(null);
    setAddMode('insert');
    setAddModalOpen(true);
  }, []);

  const handleEdit = useCallback((person: Person) => {
    setEditTarget(person);
    setEditModalOpen(true);
  }, []);

  const handleDelete = useCallback(
    (person: Person) => {
      setDeleteTarget(person);
      setDeleteContext(getDeleteContext(person.id));
      setDeleteDialogOpen(true);
    },
    [getDeleteContext]
  );

  const handleAddSubmit = useCallback(
    async (
      data: PersonFormData,
      mode: 'child' | 'spouse' | 'root' | 'insert',
      selectedUnionId?: string,
      selectedChildIds: string[] = [],
      selectedParentId?: string,
      selectedDirectChildId?: string
    ) => {
      if (mode === 'insert') {
        if (!selectedParentId || !selectedDirectChildId) return false;
        const success = await insertPersonInMiddle(
          data,
          selectedParentId,
          selectedDirectChildId
        );
        if (!success) return false;
        expandNode(selectedParentId);
        toast.success(t('toast.added'));
        return true;
      }

      const newPerson = await createPerson(data);
      if (!newPerson) return false;

      if (mode === 'root') {
        const success = await setRootPerson(newPerson.id);
        if (!success) return false;
        expandNode(newPerson.id);
        toast.success(t('toast.added'));
        return true;
      }

      if (!targetPerson) return false;

      if (mode === 'child') {
        let unionId = selectedUnionId;
        if (!unionId) {
          // Get first union or create a single-parent union
          const unions = getUnionsForPerson(targetPerson.id);
          if (unions.length > 0) {
            unionId = unions[0].id;
          } else {
            const union = await createUnion(targetPerson.id, null);
            if (!union) return false;
            unionId = union.id;
          }
        }
        const link = await addChildToUnion(unionId, newPerson.id);
        if (!link) return false;
        expandNode(targetPerson.id);
      } else if (mode === 'spouse') {
        const union = await createSpouseUnion(
          targetPerson.id,
          newPerson.id,
          selectedChildIds
        );
        if (!union) return false;
        expandNode(targetPerson.id);
      }

      toast.success(t('toast.added'));
      return true;
    },
    [
      createPerson,
      insertPersonInMiddle,
      setRootPerson,
      targetPerson,
      createUnion,
      createSpouseUnion,
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

  const handleDeleteConfirm = useCallback(
    async (choice: DeleteChoice) => {
      if (!deleteTarget || !deleteContext) return false;

      let success = false;
      if (choice === 'branch') {
        if (!deleteContext.canDeleteBranch) return false;
        success = await softDeleteBranch(deleteTarget.id);
        if (success) {
          await fetchAll();
        }
      } else {
        if (!deleteContext.canDeleteOnly) return false;
        success = await deletePersonOnly(
          deleteTarget.id,
          deleteContext.deleteOnlyMode
        );
      }

      if (success) {
        toast.success(t('toast.deleted'));
        useTreeStore.getState().setDrawerOpen(false);
      }
      return success;
    },
    [
      deleteTarget,
      deleteContext,
      softDeleteBranch,
      deletePersonOnly,
      fetchAll,
      t,
    ]
  );

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center animate-pulse">
            <TreePine className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-muted-foreground">{t('state.loading')}</p>
        </motion.div>
      </div>
    );
  }

  const hasRoot = rootPersonId && persons.some((p) => p.id === rootPersonId && !p.deleted);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar onInsertPerson={handleInsertPerson} canEdit={canEdit} />

      <main className="flex-1 relative mt-14">
        {hasRoot ? (
          <FamilyCanvas />
        ) : (
          <div className="h-full flex items-center justify-center bg-muted/40">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950 dark:to-teal-950 flex items-center justify-center mx-auto mb-5">
                <TreePine className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                {t('state.empty')}
              </h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                Start by adding the root person of your family tree
              </p>
              {canEdit && (
                <Button
                  onClick={() => {
                    setTargetPerson(null);
                    setAddMode('root');
                    setAddModalOpen(true);
                  }}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-200/50 dark:shadow-emerald-950/40"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('action.addRoot')}
                </Button>
              )}
            </motion.div>
          </div>
        )}

      </main>

      {/* Panels & Modals */}
      <PersonDrawer
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddChild={handleAddChild}
        onAddSpouse={handleAddSpouse}
        onExport={(person) => {
          setExportTarget(person);
          setExportModalOpen(true);
        }}
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
        key={deleteTarget?.id ?? 'delete-dialog'}
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteContext(null);
        }}
        person={deleteTarget}
        deleteContext={deleteContext}
        onConfirm={handleDeleteConfirm}
      />
      <ExportLanguageDialog
        open={exportModalOpen}
        person={exportTarget}
        onClose={() => {
          setExportModalOpen(false);
          setExportTarget(null);
        }}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <I18nProvider>
      <TooltipProvider>
        <TreeApp />
        <ThemeToaster />
      </TooltipProvider>
    </I18nProvider>
  );
}
