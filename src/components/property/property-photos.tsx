'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { GripVertical, ImagePlus, Loader2, MoreVertical, Star, Trash2 } from 'lucide-react';
import {
    DndContext,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import {
    useDeletePhoto,
    usePropertyPhotos,
    useReorderPhotos,
    useSetPrimaryPhoto,
    useUploadPhoto,
} from '@/hooks/use-properties';
import type { IMedia } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mirror the backend multipart limit (spring.servlet.multipart.max-file-size = 25MB) so oversized
// files are rejected before the request, instead of bouncing off a 413.
const MAX_FILE_BYTES = 25 * 1024 * 1024;

export function PropertyPhotos({ propertyId }: { propertyId: number }) {
    const { data: photos, isPending } = usePropertyPhotos(propertyId);
    const upload = useUploadPhoto(propertyId);
    const remove = useDeletePhoto(propertyId);
    const setPrimary = useSetPrimaryPhoto(propertyId);
    const reorder = useReorderPhotos(propertyId);
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    // Local order for a smooth drag; re-synced whenever the server list changes.
    const [items, setItems] = useState<IMedia[]>([]);
    useEffect(() => {
        setItems(photos ?? []);
    }, [photos]);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    function onDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = items.findIndex((m) => m.id === active.id);
        const newIndex = items.findIndex((m) => m.id === over.id);
        if (oldIndex < 0 || newIndex < 0) return;
        const next = arrayMove(items, oldIndex, newIndex);
        setItems(next);
        reorder.mutate(next.map((m) => m.id));
    }

    async function onFilesChosen(files: FileList | null) {
        if (!files || files.length === 0) return;
        const all = Array.from(files);
        const oversized = all.filter((f) => f.size > MAX_FILE_BYTES);
        if (oversized.length > 0) {
            toast.error('Imagem muito grande. Tamanho máximo: 25MB.');
        }
        const valid = all.filter((f) => f.size <= MAX_FILE_BYTES);
        if (valid.length === 0) {
            if (inputRef.current) inputRef.current.value = '';
            return;
        }
        setUploading(true);
        try {
            for (const file of valid) {
                await upload.mutateAsync(file);
            }
        } catch {
            // per-file errors are surfaced via the mutation's toast
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-base">Fotos</CardTitle>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => inputRef.current?.click()}
                >
                    {uploading ? (
                        <Loader2 className="mr-1 size-4 animate-spin" />
                    ) : (
                        <ImagePlus className="mr-1 size-4" />
                    )}
                    Adicionar fotos
                </Button>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => onFilesChosen(e.target.files)}
                />
            </CardHeader>
            <CardContent>
                {isPending ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">Carregando fotos…</p>
                ) : items.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                        Nenhuma foto ainda. Clique em “Adicionar fotos”.
                    </p>
                ) : (
                    <>
                        <p className="mb-3 text-xs text-muted-foreground">
                            Arraste pela alça para reordenar. Use o menu (⋯) para definir a capa ou excluir.
                        </p>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                            <SortableContext items={items.map((m) => m.id)} strategy={rectSortingStrategy}>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {items.map((photo) => (
                                        <SortablePhoto
                                            key={photo.id}
                                            photo={photo}
                                            busy={remove.isPending || setPrimary.isPending}
                                            onSetPrimary={() => setPrimary.mutate(photo.id)}
                                            onDelete={() => remove.mutate(photo.id)}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function SortablePhoto({
    photo,
    busy,
    onSetPrimary,
    onDelete,
}: {
    photo: IMedia;
    busy: boolean;
    onSetPrimary: () => void;
    onDelete: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: photo.id,
    });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`group relative aspect-square overflow-hidden rounded-md border border-border bg-muted ${
                isDragging ? 'z-10 opacity-80 ring-2 ring-primary' : ''
            }`}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={photo.url}
                alt={photo.fileName ?? 'Foto do imóvel'}
                draggable={false}
                className="h-full w-full object-cover"
            />

            {photo.isPrimary && (
                <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                    <Star className="size-3" /> Capa
                </span>
            )}

            {/* Drag handle — only this starts a drag, so the action menu stays clickable. */}
            <button
                type="button"
                aria-label="Arrastar para reordenar"
                className="absolute bottom-1.5 left-1.5 flex size-7 cursor-grab touch-none items-center justify-center rounded bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="size-4" />
            </button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        disabled={busy}
                        className="absolute right-1.5 top-1.5 size-7 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                        <MoreVertical className="size-3.5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {!photo.isPrimary && (
                        <DropdownMenuItem onClick={onSetPrimary}>
                            <Star className="mr-2 size-4" /> Definir como capa
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                        onClick={onDelete}
                        className="text-destructive focus:text-destructive"
                    >
                        <Trash2 className="mr-2 size-4" /> Excluir
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
