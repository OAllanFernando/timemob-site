'use client';

import { useForm, useWatch, type Control, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin } from 'lucide-react';

import {
    propertySchema,
    type PropertyInput,
    PROPERTY_TYPES,
    PROPERTY_BUSINESS_TYPES,
    PROPERTY_STATUSES,
    SOLAR_ORIENTATIONS,
    PROPERTY_POSITIONS,
} from '@/lib/schemas/property';
import type { IProperty } from '@/types/property';
import { AddressPicker } from '@/components/maps/address-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// PT-BR labels for the backend enums (admin form only — the public catalog is white-label).
const BUSINESS_LABELS: Record<string, string> = {
    SALE: 'Venda',
    RENT: 'Aluguel',
    DAILY_RENT: 'Temporada',
};

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

const TYPE_LABELS: Record<string, string> = {
    HOUSE: 'Casa',
    APARTMENT: 'Apartamento',
    TWO_STORY_HOUSE: 'Sobrado',
    COVERAGE: 'Cobertura',
    LAND: 'Terreno',
    COMMERCIAL_ROOM: 'Sala comercial',
    LAUNCH: 'Lançamento',
    UNDER_CONSTRUCTION: 'Em construção',
    ON_PLANT: 'Na planta',
    STUDIO: 'Studio',
    GARAGE: 'Garagem',
    KIT_NET: 'Kitnet',
    FARM: 'Fazenda',
    RANCH: 'Chácara',
    WAREHOUSE: 'Galpão',
    OFFICE: 'Escritório',
    SHOPPING_MALL: 'Shopping',
    INDUSTRIAL: 'Industrial',
    HOTEL: 'Hotel',
    BOUTIQUE_HOTEL: 'Hotel boutique',
    PENSION: 'Pensão',
    HOSTEL: 'Hostel',
    OTHER: 'Outro',
};

const ORIENTATION_LABELS: Record<string, string> = {
    NORTH: 'Norte',
    SOUTH: 'Sul',
    EAST: 'Leste',
    WEST: 'Oeste',
    NORTHEAST: 'Nordeste',
    NORTHWEST: 'Noroeste',
    SOUTHEAST: 'Sudeste',
    SOUTHWEST: 'Sudoeste',
};

const POSITION_LABELS: Record<string, string> = {
    FRONT: 'Frente',
    BACK: 'Fundos',
    SIDE: 'Lateral',
    FRONT_SEA_VIEW: 'Frente para o mar',
    SEA_VIEW: 'Vista para o mar',
    OPEN_VIEW: 'Vista livre',
    CORNER: 'Esquina',
    INTERNAL: 'Interno',
};

const EMPTY_DEFAULTS: PropertyInput = {
    title: '',
    description: '',
    amount: undefined as unknown as number,
    propertyBusinessType: undefined as unknown as PropertyInput['propertyBusinessType'],
    propertyType: undefined as unknown as PropertyInput['propertyType'],
    propertyStatus: 'DRAFT',
    featured: false,
    postalCode: '',
    streetName: '',
    number: '',
    condominium: '',
    tower: '',
    lot: '',
    beachDistance: '',
    latitude: null,
    longitude: null,
    neighborhoodName: '',
    cityName: '',
    stateName: '',
    uf: '',
    countryName: '',
    countryCode: '',
    differentials: '',
    visitResponsibleName: '',
    visitResponsiblePhoneNumber: '',
    exclusive: false,
    homeShow: false,
};

/** Flattens a loaded property into editable form values (geography → names). */
export function propertyToForm(p: IProperty): PropertyInput {
    return {
        ...EMPTY_DEFAULTS,
        title: p.title ?? '',
        description: p.description ?? '',
        amount: p.amount as number,
        propertyBusinessType: p.propertyBusinessType,
        propertyType: p.propertyType,
        propertyStatus: p.propertyStatus,
        featured: p.featured ?? false,
        postalCode: p.postalCode ?? '',
        streetName: p.streetName ?? '',
        number: p.number ?? '',
        condominium: p.condominium ?? '',
        tower: p.tower ?? '',
        lot: p.lot ?? '',
        beachDistance: p.beachDistance ?? '',
        solarOrientation: p.solarOrientation ?? undefined,
        propertyPosition: p.propertyPosition ?? undefined,
        latitude: p.latitude ?? null,
        longitude: p.longitude ?? null,
        neighborhoodName: p.neighborhood?.name ?? '',
        cityName: p.neighborhood?.city?.name ?? '',
        stateName: p.neighborhood?.city?.state?.name ?? '',
        uf: p.neighborhood?.city?.state?.uf ?? '',
        countryName: p.neighborhood?.city?.state?.country?.name ?? '',
        countryCode: p.neighborhood?.city?.state?.country?.code ?? '',
        condominiumTax: p.condominiumTax ?? undefined,
        iptuAmount: p.iptuAmount ?? undefined,
        expectedCommissionPercentage: p.expectedCommissionPercentage ?? undefined,
        featuredCommissionPercentage: p.featuredCommissionPercentage ?? undefined,
        bedroom: p.bedroom ?? undefined,
        suite: p.suite ?? undefined,
        bathroom: p.bathroom ?? undefined,
        carVacancy: p.carVacancy ?? undefined,
        totalArea: p.totalArea ?? undefined,
        utilArea: p.utilArea ?? undefined,
        differentials: p.differentials ?? '',
        exclusive: p.exclusive ?? false,
        homeShow: p.homeShow ?? false,
        visitResponsibleName: p.visitResponsibleName ?? '',
        visitResponsiblePhoneNumber: p.visitResponsiblePhoneNumber ?? '',
        expectedVisitDurationMinutes: p.expectedVisitDurationMinutes ?? undefined,
    };
}

interface Props {
    defaultValues?: PropertyInput;
    submitting?: boolean;
    submitLabel?: string;
    onSubmit: (values: PropertyInput) => void;
    onCancel?: () => void;
}

export function PropertyForm({ defaultValues, submitting, submitLabel = 'Salvar', onSubmit, onCancel }: Props) {
    const form = useForm<PropertyInput>({
        resolver: zodResolver(propertySchema),
        defaultValues: defaultValues ?? EMPTY_DEFAULTS,
    });
    const control = form.control;

    const lat = useWatch({ control, name: 'latitude' });
    const lng = useWatch({ control, name: 'longitude' });
    const neighborhoodName = useWatch({ control, name: 'neighborhoodName' });
    const cityName = useWatch({ control, name: 'cityName' });
    const stateName = useWatch({ control, name: 'stateName' });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Identificação</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <TextField control={control} name="title" label="Título" />
                        <FormField
                            control={control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição</FormLabel>
                                    <FormControl>
                                        <Textarea rows={4} {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <SelectField
                                control={control}
                                name="propertyBusinessType"
                                label="Operação"
                                options={PROPERTY_BUSINESS_TYPES}
                                labels={BUSINESS_LABELS}
                            />
                            <SelectField
                                control={control}
                                name="propertyType"
                                label="Tipo"
                                options={PROPERTY_TYPES}
                                labels={TYPE_LABELS}
                            />
                            <SelectField
                                control={control}
                                name="propertyStatus"
                                label="Situação"
                                options={PROPERTY_STATUSES}
                                labels={STATUS_LABELS}
                            />
                            <NumberField control={control} name="amount" label="Valor (R$)" step="0.01" />
                        </div>
                        <div className="flex flex-wrap gap-6">
                            <CheckboxField control={control} name="featured" label="Destaque" />
                            <CheckboxField control={control} name="exclusive" label="Exclusivo" />
                            <CheckboxField control={control} name="homeShow" label="Mostrar na home" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Endereço</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <AddressPicker
                            value={{ latitude: lat ?? null, longitude: lng ?? null }}
                            onChange={(addr) => {
                                form.setValue('latitude', addr.latitude ?? null, { shouldDirty: true });
                                form.setValue('longitude', addr.longitude ?? null, { shouldDirty: true });
                                form.setValue('neighborhoodName', addr.neighborhoodName || '', { shouldDirty: true });
                                form.setValue('cityName', addr.cityName || '', { shouldDirty: true });
                                form.setValue('stateName', addr.stateName || '', { shouldDirty: true });
                                form.setValue('uf', addr.uf || '', { shouldDirty: true });
                                form.setValue('countryName', addr.countryName || '', { shouldDirty: true });
                                form.setValue('countryCode', addr.countryCode || '', { shouldDirty: true });
                                if (addr.streetName) form.setValue('streetName', addr.streetName, { shouldDirty: true });
                                if (addr.number) form.setValue('number', addr.number, { shouldDirty: true });
                                if (addr.postalCode) form.setValue('postalCode', addr.postalCode, { shouldDirty: true });
                            }}
                        />
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-1.5 text-sm">
                                <MapPin className="size-3.5" /> Localização
                            </Label>
                            <Input
                                readOnly
                                tabIndex={-1}
                                className="cursor-not-allowed bg-muted/40"
                                value={[neighborhoodName, cityName, stateName].filter(Boolean).join(' · ')}
                                placeholder="Selecione um ponto no mapa para preencher bairro/cidade/estado"
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <TextField control={control} name="postalCode" label="CEP" />
                            <TextField control={control} name="streetName" label="Logradouro" />
                            <TextField control={control} name="number" label="Número" />
                            <TextField control={control} name="condominium" label="Condomínio" />
                            <TextField control={control} name="tower" label="Torre" />
                            <TextField control={control} name="lot" label="Lote" />
                            <SelectField
                                control={control}
                                name="solarOrientation"
                                label="Orientação solar"
                                options={SOLAR_ORIENTATIONS}
                                labels={ORIENTATION_LABELS}
                            />
                            <SelectField
                                control={control}
                                name="propertyPosition"
                                label="Posição"
                                options={PROPERTY_POSITIONS}
                                labels={POSITION_LABELS}
                            />
                            <TextField control={control} name="beachDistance" label="Distância da praia" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Características</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-3">
                        <NumberField control={control} name="bedroom" label="Quartos" />
                        <NumberField control={control} name="suite" label="Suítes" />
                        <NumberField control={control} name="bathroom" label="Banheiros" />
                        <NumberField control={control} name="carVacancy" label="Vagas" />
                        <NumberField control={control} name="totalArea" label="Área total (m²)" step="0.01" />
                        <NumberField control={control} name="utilArea" label="Área útil (m²)" step="0.01" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Custos</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <NumberField control={control} name="iptuAmount" label="IPTU (R$)" step="0.01" />
                        <NumberField control={control} name="condominiumTax" label="Condomínio (R$)" step="0.01" />
                        <NumberField
                            control={control}
                            name="expectedCommissionPercentage"
                            label="Comissão (%)"
                            step="0.01"
                        />
                        <NumberField
                            control={control}
                            name="featuredCommissionPercentage"
                            label="Comissão destaque (%)"
                            step="0.01"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Diferenciais e visita</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={control}
                            name="differentials"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Diferenciais</FormLabel>
                                    <FormControl>
                                        <Textarea rows={3} {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid gap-4 sm:grid-cols-3">
                            <TextField control={control} name="visitResponsibleName" label="Responsável pela visita" />
                            <TextField
                                control={control}
                                name="visitResponsiblePhoneNumber"
                                label="Telefone do responsável"
                            />
                            <NumberField
                                control={control}
                                name="expectedVisitDurationMinutes"
                                label="Duração da visita (min)"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancelar
                        </Button>
                    )}
                    <Button type="submit" disabled={submitting}>
                        {submitLabel}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

function TextField({ control, name, label }: { control: Control<PropertyInput>; name: Path<PropertyInput>; label: string }) {
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                        <Input {...field} value={(field.value as string) ?? ''} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

function NumberField({
    control,
    name,
    label,
    step,
}: {
    control: Control<PropertyInput>;
    name: Path<PropertyInput>;
    label: string;
    step?: string;
}) {
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                        <Input
                            type="number"
                            step={step}
                            value={field.value == null ? '' : String(field.value)}
                            onChange={(e) =>
                                field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)
                            }
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

function SelectField({
    control,
    name,
    label,
    options,
    labels,
}: {
    control: Control<PropertyInput>;
    name: Path<PropertyInput>;
    label: string;
    options: readonly string[];
    labels: Record<string, string>;
}) {
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <Select value={(field.value as string) ?? ''} onValueChange={field.onChange}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {options.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                    {labels[opt] ?? opt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

function CheckboxField({ control, name, label }: { control: Control<PropertyInput>; name: Path<PropertyInput>; label: string }) {
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                    <FormControl>
                        <Checkbox checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal">{label}</FormLabel>
                </FormItem>
            )}
        />
    );
}
