import { z } from 'zod';

export const registerSchema = z
    .object({
        name: z.string().min(2, 'Informe seu nome completo'),
        email: z.string().email('Email inválido'),
        phoneNumber: z.string().min(8, 'Informe um telefone válido'),
        naturalPersonDocument: z.string().optional(),
        password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
        confirmPassword: z.string().min(1, 'Confirme a senha'),
        acceptTerms: z.literal(true, {
            message: 'É necessário aceitar os termos para continuar',
        }),
        fillInterestProfile: z.boolean().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        path: ['confirmPassword'],
        message: 'As senhas não coincidem',
    });

export type RegisterInput = z.infer<typeof registerSchema>;
