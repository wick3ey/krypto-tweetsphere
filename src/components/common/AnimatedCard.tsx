
import React from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className,
  delay = 0
}) => {
  const animationStyle = {
    animationDelay: delay ? `${delay}ms` : undefined
  };

  return (
    <div 
      className={cn(
        "opacity-0 animate-fade-in glass-card",
        className
      )}
      style={animationStyle}
    >
      {children}
    </div>
  );
};

export default AnimatedCard;
