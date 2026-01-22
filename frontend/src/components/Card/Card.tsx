import React from 'react'
import { motion } from 'framer-motion'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hover = false,
}) => {
  const baseStyles = 'bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700'
  
  const Component = onClick || hover ? motion.div : 'div'
  const motionProps = onClick || hover ? {
    whileHover: hover ? { y: -4, transition: { duration: 0.2 } } : undefined,
    whileTap: onClick ? { scale: 0.98 } : undefined,
    className: `${baseStyles} ${onClick ? 'cursor-pointer' : ''} ${className}`,
    onClick,
  } : {
    className: `${baseStyles} ${className}`,
  }
  
  return <Component {...motionProps}>{children}</Component>
}

export default Card
