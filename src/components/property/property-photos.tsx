'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Star, Trash2 } from 'lucide-react';

import { useDeletePhoto, usePropertyPhotos, useUploadPhoto } from '@/hooks/use-properties';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PropertyPhotos({ propertyId }: { propertyId: number }) {
    const { data: photos, isPending } = usePropertyPhotos(propertyId);
    const upload = useUploadPhoto(propertyId);
    const remove = useDeletePhoto(propertyId);
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    async function onFilesChosen(files: FileList | null) {
        if (!files || files.length === 0) return;
        setUploading(true);
        try {
            for (const file of Array.from(files)) {
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
                    {uploading ? <Loader2 className="mr-1 size-4 animate-spin" /> : <ImagePlus className="mr-1 size-4" />}
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
                ) : !photos || photos.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                        Nenhuma foto ainda. Clique em “Adicionar fotos”.
                    </p>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {photos.map((photo) => (
                            <div
                                key={photo.id}
                                className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={photo.url}
                                    alt={photo.fileName ?? 'Foto do imóvel'}
                                    className="h-full w-full object-cover"
                                />
                                {photo.isPrimary && (
                                    <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                                        <Star className="size-3" /> Capa
                                    </span>
                                )}
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute right-1.5 top-1.5 size-7 opacity-0 transition-opacity group-hover:opacity-100"
                                    disabled={remove.isPending}
                                    onClick={() => remove.mutate(photo.id)}
                                >
                                    <Trash2 className="size-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
