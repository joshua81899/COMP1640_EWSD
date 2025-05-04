import React from 'react';
import { motion } from 'framer-motion';

/**
 * A simple content card component for the dashboard
 * Styled to match the dark theme with clean borders
 */
const ContentCard = ({
  title,
  children,
  className = '',
  centered = false,
  delay = 0
}) => {
  return (
    <motion.div 
      className={`bg-gray-800 rounded-lg p-6 mb-0 w-full ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      {title && <h2 className="text-xl font-semibold text-white mb-4 text-center">{title}</h2>}
      <div className={centered ? "flex flex-col items-center justify-center text-center" : "w-full mx-auto"}>
        {children}
      </div>
    </motion.div>
  );
};

export default ContentCard;