import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'premium' | 'premium-subtle' | 'ghost' | 'outline' | 'secondary';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'default', size = 'md', isLoading, leftIcon, rightIcon, children, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:pointer-events-none";

        const variants = {
            default: "bg-white text-black hover:bg-neutral-200 border border-transparent",
            premium: "bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/50 text-orange-100 shadow-[0_0_20px_-5px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_-5px_rgba(249,115,22,0.5)] hover:border-orange-500/70 hover:bg-orange-500/10 active:scale-95 relative overflow-hidden",
            "premium-subtle": "bg-neutral-900 text-neutral-200 border border-neutral-800 shadow-[0_0_20px_-5px_rgba(249,115,22,0.3)] hover:bg-gradient-to-br hover:from-orange-500/20 hover:to-red-500/20 hover:border-orange-500/50 hover:text-orange-100 hover:shadow-[0_0_25px_-5px_rgba(249,115,22,0.5)] active:scale-95 relative overflow-hidden",
            ghost: "bg-transparent text-neutral-400 hover:text-white hover:bg-white/5",
            outline: "bg-transparent border border-neutral-800 text-neutral-300 hover:border-neutral-600 hover:text-white",
            secondary: "bg-neutral-800 text-neutral-200 hover:bg-neutral-700 border border-neutral-700"
        };

        const sizes = {
            sm: "h-8 px-3 text-xs",
            md: "h-10 px-4 py-2 text-sm",
            lg: "h-12 px-6 text-base",
            icon: "h-10 w-10 p-2"
        };

        const classes = `
            ${baseStyles}
            ${variants[variant]}
            ${sizes[size]}
            ${className}
        `;

        return (
            <button
                ref={ref}
                className={classes.trim().replace(/\s+/g, ' ')}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {variant === 'premium' && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/10 to-transparent opacity-50 blur-sm pointer-events-none" />
                )}

                {isLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : leftIcon ? (
                    <span className="mr-2">{leftIcon}</span>
                ) : null}

                {children}

                {!isLoading && rightIcon && (
                    <span className="ml-2">{rightIcon}</span>
                )}
            </button>
        );
    }
);

Button.displayName = "Button";
