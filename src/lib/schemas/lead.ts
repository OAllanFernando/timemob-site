import { z } from 'zod';

export const LEAD_SOURCES = ['PROPERTY_TALK', 'KNOW_MORE', 'GENERIC_CONTACT'] as const;

export type LeadFormSource = (typeof LEAD_SOURCES)[number];

export const INTEREST_TAGS = [
    'Pretendo morar',
    'Investimento',
    'Reforma',
    'Urgente',
    'Sem pressa',
] as const;

export const leadSchema = z
    .object({
        name: z.string().min(2, 'Informe seu nome'),
        email: z.string().email('Email inválido'),
        phone: z.string().min(8, 'Informe um telefone válido'),
        message: z.string().optional(),
        source: z.enum(LEAD_SOURCES, {
            message: 'Selecione o motivo do contato',
        }),
        interestTags: z.array(z.string()).optional(),
        interestLatitude: z.number().nullable().optional(),
        interestLongitude: z.number().nullable().optional(),
        acceptTerms: z.literal(true, {
            message: 'É necessário aceitar os termos para continuar',
        }),
        createAccount: z.boolean().optional(),
        password: z.string().optional(),
        confirmPassword: z.string().optional(),
        fillInterestProfile: z.boolean().optional(),
    })
    .superRefine((data, ctx) => {
        if (!data.createAccount) return;
        if (!data.password || data.password.length < 8) {
            ctx.addIssue({
                code: 'custom',
                path: ['password'],
                message: 'A senha deve ter pelo menos 8 caracteres',
            });
        }
        if (data.password !== data.confirmPassword) {
            ctx.addIssue({
                code: 'custom',
                path: ['confirmPassword'],
                message: 'As senhas não coincidem',
            });
        }
    });

export type LeadInput = z.infer<typeof leadSchema>;
