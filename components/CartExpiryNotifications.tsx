import { useState, useEffect, useContext } from 'react';
import { CartContext } from 'context/CartWrapper';
import { AnimatePresence, motion } from 'framer-motion';
import { FiX, FiShoppingCart, FiClock } from 'react-icons/fi';
import { useRouter } from 'next/router';

interface NotificationState {
  show50min: boolean;
  show55min: boolean;
  show59min: boolean;
  dismissed59min: boolean;
}

const CartExpiryNotifications = () => {
  const { items } = useContext(CartContext);
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<'50min' | '55min' | '59min' | null>(null);
  const [notificationState, setNotificationState] = useState<NotificationState>({
    show50min: false,
    show55min: false,
    show59min: false,
    dismissed59min: false
  });

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Main timer logic
  useEffect(() => {
    if (items.length === 0) {
      // Reset all notifications when cart is empty
      setCurrentNotification(null);
      setNotificationState({
        show50min: false,
        show55min: false,
        show59min: false,
        dismissed59min: false
      });
      return;
    }

    const checkCartExpiry = () => {
      try {
        const cartTimestamp = localStorage.getItem('cart-timestamp');
        if (!cartTimestamp) return;

        const now = Date.now();
        const saved = parseInt(cartTimestamp);
        const timeElapsed = now - saved;
        const oneHourInMs = 60 * 60 * 1000; // 1 hour
        
        // Calculate remaining time
        const timeRemaining = oneHourInMs - timeElapsed;
        const minutesRemaining = Math.floor(timeRemaining / (60 * 1000));

        // 50 minutes (10 min remaining)
        if (minutesRemaining <= 10 && minutesRemaining > 5 && !notificationState.show50min) {
          setCurrentNotification('50min');
          setNotificationState(prev => ({ ...prev, show50min: true }));
          
          // Auto-hide after 5 seconds (non-persistent)
          setTimeout(() => {
            setCurrentNotification(null);
          }, 5000);
        }
        
        // 55 minutes (5 min remaining)  
        else if (minutesRemaining <= 5 && minutesRemaining > 1 && !notificationState.show55min) {
          setCurrentNotification('55min');
          setNotificationState(prev => ({ ...prev, show55min: true }));
          
          // Auto-hide after 5 seconds (non-persistent)
          setTimeout(() => {
            setCurrentNotification(null);
          }, 5000);
        }
        
        // 59 minutes (1 min remaining) - PERSISTENT
        else if (minutesRemaining <= 1 && !notificationState.show59min && !notificationState.dismissed59min) {
          setCurrentNotification('59min');
          setNotificationState(prev => ({ ...prev, show59min: true }));
          // No auto-hide - this one is persistent
        }
      } catch (error) {
        console.error('Error checking cart expiry:', error);
      }
    };

    // Check immediately and then every 30 seconds
    checkCartExpiry();
    const interval = setInterval(checkCartExpiry, 30000);

    return () => clearInterval(interval);
  }, [items.length, notificationState]);

  // Reset notifications when items are added/updated (handled by timestamp update)
  useEffect(() => {
    // Reset notification state when cart changes (new items added)
    setNotificationState({
      show50min: false,
      show55min: false,
      show59min: false,
      dismissed59min: false
    });
  }, [items.length]);

  const handleDismiss = () => {
    if (currentNotification === '59min') {
      setNotificationState(prev => ({ ...prev, dismissed59min: true }));
    }
    setCurrentNotification(null);
  };

  const handleCheckout = () => {
    router.push('/checkout');
    setCurrentNotification(null);
  };

  const getNotificationConfig = (type: '50min' | '55min' | '59min') => {
    switch (type) {
      case '50min':
        return {
          title: 'Cart Reminder',
          message: 'Items in your cart will expire in 10 minutes',
          bgColor: 'bg-blue-500',
          textColor: 'text-white',
          icon: FiClock
        };
      case '55min':
        return {
          title: 'Cart Warning',
          message: 'Your cart expires in 5 minutes!',
          bgColor: 'bg-yellow-500',
          textColor: 'text-black',
          icon: FiClock
        };
      case '59min':
        return {
          title: 'Cart Expiring Soon!',
          message: 'Cart expires in 1 minute! Complete checkout now?',
          bgColor: 'bg-red-500',
          textColor: 'text-white',
          icon: FiShoppingCart
        };
    }
  };

  if (!currentNotification) return null;

  const config = getNotificationConfig(currentNotification);
  const Icon = config.icon;

  // Desktop Toast Notification (Top-right corner)
  const DesktopToast = () => (
    <motion.div
      initial={{ opacity: 0, x: 100, y: -20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`fixed top-24 right-6 z-50 ${config.bgColor} ${config.textColor} rounded-xl shadow-2xl min-w-80 max-w-96`}
      style={{
        backdropFilter: "blur(15px)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        boxShadow: `
          0 20px 40px rgba(0, 0, 0, 0.15),
          inset 0 1px 0 rgba(255, 255, 255, 0.2)
        `
      }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Icon size={20} />
            <h4 className="font-semibold text-sm">{config.title}</h4>
          </div>
          <button
            onClick={handleDismiss}
            className={`${config.textColor} hover:opacity-70 transition-opacity`}
          >
            <FiX size={18} />
          </button>
        </div>
        
        <p className="text-sm mb-4 opacity-90">{config.message}</p>
        
        <div className="flex gap-2">
          <button
            onClick={handleCheckout}
            className="flex-1 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-sm"
          >
            Checkout Now
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-2 rounded-lg text-sm opacity-70 hover:opacity-100 transition-opacity"
          >
            Dismiss
          </button>
        </div>
      </div>
    </motion.div>
  );

  // Mobile Modal Notification
  const MobileModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`w-full max-w-sm ${config.bgColor} ${config.textColor} rounded-2xl shadow-2xl`}
        style={{
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Icon size={24} />
              <h4 className="font-semibold text-lg">{config.title}</h4>
            </div>
            <button
              onClick={handleDismiss}
              className={`${config.textColor} hover:opacity-70 transition-opacity`}
            >
              <FiX size={20} />
            </button>
          </div>
          
          <p className="text-base mb-6 opacity-90">{config.message}</p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={handleCheckout}
              className="w-full bg-white/20 hover:bg-white/30 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 backdrop-blur-sm"
            >
              Checkout Now
            </button>
            <button
              onClick={handleDismiss}
              className="w-full px-4 py-3 rounded-xl text-base opacity-70 hover:opacity-100 transition-opacity"
            >
              Dismiss
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {currentNotification && (
        isMobile ? <MobileModal /> : <DesktopToast />
      )}
    </AnimatePresence>
  );
};

export default CartExpiryNotifications;