import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * ImportantDateItem component for displaying important dates in the sidebar and dashboard
 * 
 * @param {Object} props Component props
 * @param {string} props.title Title of the important date (e.g., "Submission Deadline")
 * @param {string} props.date The date to display (e.g., "May 25, 2025")
 * @param {string} props.className Additional CSS classes
 * @param {number} props.delay Animation delay in seconds
 * @param {boolean} props.animate Whether to animate the component
 */
const ImportantDateItem = ({
  title,
  date,
  className = '',
  delay = 0,
  animate = true
}) => {
  // Base component rendering without animation
  const content = (
    <>
      <p className="text-white font-medium">{title}:</p>
      <p className="text-yellow-400">{date}</p>
    </>
  );

  // Return animated or static version based on prop
  return animate ? (
    <motion.div 
      className={`bg-gray-700 rounded-md p-3 text-sm ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      {content}
    </motion.div>
  ) : (
    <div className={`bg-gray-700 rounded-md p-3 text-sm ${className}`}>
      {content}
    </div>
  );
};

// Prop types for documentation and validation
ImportantDateItem.propTypes = {
  title: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  className: PropTypes.string,
  delay: PropTypes.number,
  animate: PropTypes.bool
};

export default ImportantDateItem;