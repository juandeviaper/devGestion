import React from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
    username?: string;
    photo?: string | null;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ username, photo, size = 'md', className = '' }) => {
    const getInitials = (user?: string) => {
        if (!user) return '?';
        return user.charAt(0).toUpperCase();
    };

    const sizeClasses = {
        xs: 'w-6 h-6 text-[10px]',
        sm: 'w-8 h-8 text-[12px]',
        md: 'w-10 h-10 text-[14px]',
        lg: 'w-14 h-14 text-lg',
        xl: 'w-24 h-24 text-2xl',
    };

    const iconSizes = {
        xs: 12,
        sm: 16,
        md: 20,
        lg: 28,
        xl: 48,
    };

    const shades = [
        'bg-[#10B981]', // Emerald Base
        'bg-[#059669]', // Emerald Dark
        'bg-[#34D399]', // Emerald Light
        'bg-[#0F172A]', // dark slate
        'bg-[#1E293B]', // slate 800
        'bg-[#0D9488]', // teal 600
        'bg-[#065F46]', // emerald 800
    ];
    
    // Deterministic color based on username
    const colorIndex = username ? username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % shades.length : 0;
    const bgColor = shades[colorIndex];


    if (photo) {
        // Construct full URL if it's a relative path from the backend
        const photoUrl = photo.startsWith('http') ? photo : `http://localhost:8000${photo}`;
        return (
            <div className={`${sizeClasses[size]} rounded-full overflow-hidden border border-[#E9ECEF] flex-shrink-0 ${className}`}>
                <img src={photoUrl} alt={username} className="w-full h-full object-cover" />
            </div>
        );
    }

    return (
        <div className={`${sizeClasses[size]} rounded-full ${bgColor} text-white flex items-center justify-center font-black uppercase tracking-tighter flex-shrink-0 border-2 border-white shadow-sm ${className}`}>
            {username ? getInitials(username) : <User size={iconSizes[size]} />}
        </div>
    );
};

export default Avatar;
