'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Eye, FileText, Loader2, Trash2, Upload } from 'lucide-react';

import {
    useDeleteDocument,
    usePropertyDocuments,
    useUploadDocument,
} from '@/hooks/use-properties';
import { propertyService } from '@/services/property-service';
import type { DocumentCategory } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const MAX_FILE_BYTES = 25 * 1024 * 1024;

const CATEGORIES: { value: DocumentCategory; label: string }[] = [
    { value: 'SALE_AUTHORIZATION', label: 'Autorização de venda' },
    { value: 'PROPERTY_REGISTRATION', label: 'Matrícula' },
    { value: 'DEED', label: 'Escritura' },
    { value: 'CONTRACT', label: 'Contrato' },
    { value: 'OTHER', label: 'Outro' },
];
const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
    CATEGORIES.map((c) => [c.value, c.label]),
);

export function PropertyDocuments({ propertyId }: { propertyId: number }) {
    const { data: docs, isPending } = usePropertyDocuments(propertyId);
    const upload = useUploadDocument(propertyId);
    const remove = useDeleteDocument(propertyId);
    const inputRef = useRef<HTMLInputElement>(null);
    const [category, setCategory] = useState<DocumentCategory>('SALE_AUTHORIZATION');
    const [uploading, setUploading] = useState(false);
    const [opening, setOpening] = useState<number | null>(null);

    async function onFileChosen(files: FileList | null) {
        const file = files?.[0];
        if (!file) return;
        if (file.size > MAX_FILE_BYTES) {
            toast.error('Arquivo muito grande. Tamanho máximo: 25MB.');
            if (inputRef.current) inputRef.current.value = '';
            return;
        }
        setUploading(true);
        try {
            await upload.mutateAsync({ file, category });
        } catch {
            // surfaced by the mutation toast
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    }

    async function openDocument(mediaId: number) {
        setOpening(mediaId);
        try {
            const res = await propertyService.getDocumentUrl(propertyId, mediaId);
            window.open(res.data.url, '_blank', 'noopener,noreferrer');
        } catch {
            toast.error('Não foi possível abrir o documento');
        } finally {
            setOpening(null);
        }
    }

    const saleAuth = docs?.find((d) => d.documentCategory === 'SALE_AUTHORIZATION');

    return (
        <Card>
            <CardHeader className="space-y-3">
                <div className="flex flex-row items-center justify-between gap-2">
                    <CardTitle className="text-base">Documentos</CardTitle>
                    <div className="flex items-center gap-2">
                        <Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory)}>
                            <SelectTrigger className="h-9 w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map((c) => (
                                    <SelectItem key={c.value} value={c.value}>
                                        {c.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                                <Upload className="mr-1 size-4" />
                            )}
                            Adicionar
                        </Button>
                        <input
                            ref={inputRef}
                            type="file"
                            accept="application/pdf,image/*"
                            className="hidden"
                            onChange={(e) => onFileChosen(e.target.files)}
                        />
                    </div>
                </div>
                {saleAuth && (
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="w-fit"
                        disabled={opening === saleAuth.id}
                        onClick={() => openDocument(saleAuth.id)}
                    >
                        {opening === saleAuth.id ? (
                            <Loader2 className="mr-1 size-4 animate-spin" />
                        ) : (
                            <Eye className="mr-1 size-4" />
                        )}
                        Ver autorização de venda
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {isPending ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">Carregando documentos…</p>
                ) : !docs || docs.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                        Nenhum documento ainda. Selecione o tipo e clique em “Adicionar”.
                    </p>
                ) : (
                    <ul className="divide-y rounded-md border">
                        {docs.map((doc) => (
                            <li key={doc.id} className="flex items-center justify-between gap-3 p-3">
                                <div className="flex min-w-0 items-center gap-2">
                                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">
                                            {doc.fileName ?? `Documento #${doc.id}`}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {CATEGORY_LABELS[doc.documentCategory ?? 'OTHER'] ?? 'Outro'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        disabled={opening === doc.id}
                                        onClick={() => openDocument(doc.id)}
                                    >
                                        {opening === doc.id ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                        <span className="ml-1 hidden sm:inline">Ver</span>
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        disabled={remove.isPending}
                                        onClick={() => remove.mutate(doc.id)}
                                    >
                                        <Trash2 className="size-3.5 text-destructive" />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
