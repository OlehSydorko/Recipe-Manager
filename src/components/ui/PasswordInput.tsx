'use client';

import { type InputHTMLAttributes, useState } from 'react';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Eye, EyeOff } from 'lucide-react';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export function PasswordInput({ className, ...rest }: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false);

    const handleToggleVisibility = () => setShowPassword((prev) => !prev);

    return (
        <div className='relative'>
            <Input type={showPassword ? 'text' : 'password'} className={`pr-11 ${className ?? ''}`} {...rest} />
            <IconButton
                type='button'
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className='absolute right-0.5 top-1/2 h-9 w-9 -translate-y-1/2'
                onClick={handleToggleVisibility}
            >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </IconButton>
        </div>
    );
}
