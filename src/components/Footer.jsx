import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Footer component for the dashboard
 * 
 * @param {Object} props
 * @param {Array} props.links - Array of link objects with to and label properties
 * @param {string} props.className - Additional CSS classes
 */
const Footer = ({
  links = [
    { to: '/privacy', label: 'Privacy Policy' },
    { to: '/terms', label: 'Terms of Service' },
    { to: '/contact', label: 'Contact' }
  ],
  className = ''
}) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={`bg-gray-800 py-4 px-4 sm:px-6 lg:px-8 mt-6 border-t border-gray-700 ${className}`}>
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <div className="mb-4 sm:mb-0">
          <p className="text-sm text-gray-400">
            &copy; {currentYear} University Magazine. All rights reserved.
          </p>
        </div>
        <div className="flex space-x-4">
          {links.map((link, index) => (
            <Link 
              key={index}
              to={link.to}
              className="text-sm text-gray-400 hover:text-white transition"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;