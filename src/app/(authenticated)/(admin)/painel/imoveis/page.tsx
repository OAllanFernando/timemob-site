'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    FileCheck2,
    Loader2,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';

import {
    useCreateProperty,
    useDeleteProperty,
    useMyProperties,
    useMyProperty,
    useUpdateProperty,
} from '@/hooks/use-properties';
import { propertyService } from '@/services/property-service';
import { PropertyForm, propertyToForm } from '@/components/property/property-form';
import { PropertyPhotos } from '@/components/property/property-photos';
import { PropertyDocuments } from '@/components/property/property-documents';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const BUSINESS_LABELS: Record<string, string> = { SALE: 'Venda', RENT: 'Aluguel', DAILY_RENT: 'Temporada' };
const STATUS_LABELS: Record<string, string> = {
    DRAFT: 'Rascunho',
    PUBLISHED: 'Publicado',
    HIDDEN: 'Oculto',
    RESERVED: 'Reservado',
    SOLD: 'Vendido',
    RENTED: 'Alugado',
    WAITING_REVISION: 'Aguardando revisão',
    DISAPPROVED: 'Reprovado',
};

export default function AdminPropertiesPage() {
    const { data, isPending, error } = useMyProperties();
    const del = useDeleteProperty();
    const [open, setOpen] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [openingAuth, setOpeningAuth] = useState<number | null>(null);

    async function openSaleAuth(propertyId: number, mediaId: number) {
        setOpeningAuth(propertyId);
        try {
            const res = await propertyService.getDocumentUrl(propertyId, mediaId);
            window.open(res.data.url, '_blank', 'noopener,noreferrer');
        } catch {
            toast.error('Não foi possível abrir a autorização de venda');
        } finally {
            setOpeningAuth(null);
        }
    }

    function openNew() {
        setEditingId(null);
        setOpen(true);
    }
    function openEdit(id: number) {
        setEditingId(id);
        setOpen(true);
    }
    function handleDelete(id: number) {
        if (window.confirm('Remover este imóvel? Esta ação não pode ser desfeita.')) {
            del.mutate(id);
        }
    }

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between gap-4">
                <h1 className="font-heading text-3xl font-medium tracking-tight">Imóveis</h1>
                <Button onClick={openNew}>
                    <Plus className="mr-1 size-4" />
                    Novo imóvel
                </Button>
            </header>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertDescription>Não foi possível carregar os imóveis.</AlertDescription>
                </Alert>
            )}

            {isPending ? (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                    ))}
                </div>
            ) : !data || data.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-sm text-muted-foreground">
                        Nenhum imóvel cadastrado ainda. Clique em “Novo imóvel” para começar.
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {data.map((p) => (
                        <Card key={p.id}>
                            <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                                <div className="min-w-0 space-y-1">
                                    <p className="truncate font-medium">{p.title || `Imóvel #${p.id}`}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {p.amount != null ? BRL.format(p.amount) : '—'}
                                        {p.propertyBusinessType
                                            ? ` · ${BUSINESS_LABELS[p.propertyBusinessType] ?? p.propertyBusinessType}`
                                            : ''}
                                        {p.propertyStatus
                                            ? ` · ${STATUS_LABELS[p.propertyStatus] ?? p.propertyStatus}`
                                            : ''}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {p.saleAuthorizationMediaId != null && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            disabled={openingAuth === p.id}
                                            onClick={() => openSaleAuth(p.id, p.saleAuthorizationMediaId!)}
                                        >
                                            {openingAuth === p.id ? (
                                                <Loader2 className="mr-1 size-3.5 animate-spin" />
                                            ) : (
                                                <FileCheck2 className="mr-1 size-3.5" />
                                            )}
                                            Autorização
                                        </Button>
                                    )}
                                    <Button variant="outline" size="sm" onClick={() => openEdit(p.id)}>
                                        <Pencil className="mr-1 size-3.5" />
                                        Editar
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(p.id)}
                                        disabled={del.isPending}
                                    >
                                        <Trash2 className="size-3.5 text-destructive" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent
                    side="right"
                    // Inline maxWidth always wins over the component's width classes — 42rem (2xl)
                    // collapsed, 96vw expanded. Mobile stays full-width (original). No overflow here so
                    // the round handle can hang outside the left edge; the scroll lives on the inner div.
                    style={{ maxWidth: expanded ? '96vw' : undefined }}
                    className="w-full overflow-visible p-0 transition-[max-width] duration-200 sm:max-w-2xl"
                >
                    {/* Desktop-only round "pull" handle, hanging off the left edge. Hidden on mobile. */}
                    <button
                        type="button"
                        onClick={() => setExpanded((v) => !v)}
                        aria-label={expanded ? 'Recolher painel' : 'Expandir painel'}
                        title={expanded ? 'Recolher' : 'Expandir'}
                        className="absolute left-0 top-1/2 z-30 hidden size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-background text-foreground shadow-md transition-colors hover:bg-accent sm:flex"
                    >
                        {expanded ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
                    </button>
                    <div className="h-full overflow-y-auto p-6">
                        <SheetHeader className="px-0 pr-10">
                            <SheetTitle>{editingId ? 'Editar imóvel' : 'Novo imóvel'}</SheetTitle>
                        </SheetHeader>
                        {open && <PropertyEditor propertyId={editingId} onDone={() => setOpen(false)} />}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

function PropertyEditor({ propertyId, onDone }: { propertyId: number | null; onDone: () => void }) {
    const isEdit = propertyId != null;
    const { data: existing, isPending } = useMyProperty(propertyId);
    const createMutation = useCreateProperty();
    const updateMutation = useUpdateProperty(propertyId ?? 0);
    const mutation = isEdit ? updateMutation : createMutation;

    if (isEdit && isPending) {
        return (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PropertyForm
                key={propertyId ?? 'new'}
                defaultValues={isEdit && existing ? propertyToForm(existing) : undefined}
                submitting={mutation.isPending}
                submitLabel={isEdit ? 'Salvar alterações' : 'Cadastrar'}
                onSubmit={(values) => mutation.mutate(values, { onSuccess: onDone })}
                onCancel={onDone}
            />
            {isEdit && propertyId != null && (
                <>
                    <PropertyPhotos propertyId={propertyId} />
                    <PropertyDocuments propertyId={propertyId} />
                </>
            )}
        </div>
    );
}
