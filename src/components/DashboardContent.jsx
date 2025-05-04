import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const DashboardContent = ({ 
  activeTab, 
  tabs, 
  isLoading 
}) => {
  const tabContentRef = useRef(null);
  const contentRefs = useRef([]);

  // GSAP animations for tab transitions
  useEffect(() => {
    if (!isLoading && tabContentRef.current) {
      // Kill any existing animations
      gsap.killTweensOf(tabContentRef.current);
      gsap.killTweensOf(contentRefs.current);
      
      // Fade out content before switching
      gsap.to(tabContentRef.current, {
        opacity: 0,
        duration: 0.2,
        ease: "power2.out",
        onComplete: () => {
          // Clear content refs for the new tab
          contentRefs.current = [];
          
          // Force reflow to ensure new content is rendered
          setTimeout(() => {
            // Fade in the new content
            gsap.fromTo(
              tabContentRef.current,
              { opacity: 0, y: 10 },
              { 
                opacity: 1, 
                y: 0,
                duration: 0.3,
                ease: "power2.out"
              }
            );
            
            // Animate individual content elements
            if (contentRefs.current.length > 0) {
              gsap.fromTo(
                contentRefs.current,
                { y: 20, opacity: 0 },
                { 
                  y: 0, 
                  opacity: 1, 
                  stagger: 0.1, 
                  duration: 0.4, 
                  ease: "power2.out",
                  delay: 0.2
                }
              );
            }
          }, 10);
        }
      });
    }
  }, [isLoading, activeTab]);

  // Function to add elements to the refs for animation
  const addToContentRefs = (el) => {
    if (el && !contentRefs.current.includes(el)) {
      contentRefs.current.push(el);
    }
  };

  // Find the current tab content
  const currentTabContent = tabs.find(tab => tab.id === activeTab);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <main ref={tabContentRef} className="py-6 px-4 sm:px-6 lg:px-8 opacity-100">
      {currentTabContent ? (
        <div className="space-y-6">
          <div ref={addToContentRefs} className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
            <div>
              <h2 className="text-xl font-bold text-white mb-6">{currentTabContent.title}</h2>
              {/* Render the tab content with the addToContentRefs function */}
              {currentTabContent.content && currentTabContent.content(addToContentRefs)}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-white text-lg">Tab content not found</p>
        </div>
      )}
    </main>
  );
};

export default DashboardContent;