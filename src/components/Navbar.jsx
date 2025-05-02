import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaTimes, FaComments, FaSignOutAlt } from "react-icons/fa";
import { auth } from "../services/firebase";
import { signOut } from "firebase/auth";
import { db } from "../services/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function Navbar() {
  const { user, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasMessages, setHasMessages] = useState(false);

  useEffect(() => {
    if (!user) {
      setHasMessages(false);
      return;
    }

    const q1 = query(collection(db, "challenges"), where("userId", "==", user.uid));
    const q2 = query(collection(db, "challenges"));

    const unsub1 = onSnapshot(q1, (snapshot) => {
      setHasMessages(!snapshot.empty);
    });

    const unsub2 = onSnapshot(q2, (snapshot) => {
      const accepted = snapshot.docs.some((doc) =>
        doc.data().acceptedBy?.some((entry) => entry.userId === user.uid)
      );
      setHasMessages((prev) => prev || accepted);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) return null;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-md border-b border-gray-800 shadow-md h-16 flex items-center justify-between px-5 sm:px-8 lg:px-12"
    >
      {/* Logo */}
      <Link to="/" className="text-2xl font-bold text-indigo-500 tracking-wide hover:text-indigo-400 transition">
        GameBattle
      </Link>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center gap-6">
        {user ? (
          <>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/feed">Feed</NavLink>
          
            {hasMessages && (
              <NavLink to="/messages">
                <FaComments className="inline mr-1 mb-1" /> Messages
              </NavLink>
            )}
            <NavLink to="/profile">Profile</NavLink>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-300 hover:text-red-400 transition"
            >
              <FaSignOutAlt /> Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <Link
              to="/signup"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden text-gray-300 hover:text-indigo-400 transition"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
      </button>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 left-0 right-0 bg-gray-900 border-t border-gray-700 shadow-lg py-5 px-6 md:hidden"
          >
            <div className="flex flex-col gap-4 text-center">
              {user ? (
                <>
                  <MobileLink to="/dashboard" setOpen={setIsMenuOpen}>Dashboard</MobileLink>
                  <NavLink to="/feed">Feed</NavLink>
                  {hasMessages && (
                    <MobileLink to="/messages" setOpen={setIsMenuOpen}>
                      <FaComments className="inline mr-1 mb-1" /> Messages
                    </MobileLink>
                  )}
                  <MobileLink to="/profile" setOpen={setIsMenuOpen}>Profile</MobileLink>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="text-gray-300 hover:text-red-400 flex justify-center items-center gap-2 transition"
                  >
                    <FaSignOutAlt /> Logout
                  </button>
                </>
              ) : (
                <>
                  <MobileLink to="/login" setOpen={setIsMenuOpen}>Login</MobileLink>
                  <Link
                    to="/signup"
                    className="bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

// Utility Components
function NavLink({ to, children }) {
  return (
    <Link to={to} className="text-gray-300 hover:text-indigo-400 transition font-medium">
      {children}
    </Link>
  );
}

function MobileLink({ to, setOpen, children }) {
  return (
    <Link
      to={to}
      className="text-gray-300 hover:text-indigo-400 transition"
      onClick={() => setOpen(false)}
    >
      {children}
    </Link>
  );
}
