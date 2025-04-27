import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
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

    const q1 = query(
      collection(db, "challenges"),
      where("userId", "==", user.uid)
    );
    const q2 = query(collection(db, "challenges"));

    const unsub1 = onSnapshot(q1, (snapshot) => {
      setHasMessages(!snapshot.empty);
    }, (error) => {
      console.error("Error checking created challenges:", error);
    });
    const unsub2 = onSnapshot(q2, (snapshot) => {
      const hasAccepted = snapshot.docs.some((doc) =>
        doc.data().acceptedBy?.some((entry) => entry.userId === user.uid)
      );
      setHasMessages((prev) => prev || hasAccepted);
    }, (error) => {
      console.error("Error checking accepted challenges:", error);
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
      console.error("Error signing out:", error);
    }
  };

  // Don't show anything while loading
  if (loading) {
    return null;
  }

  return (
    <motion.nav
      className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4 bg-gray-900 border-b border-gray-700 fixed w-full z-50 h-16 top-0"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Link
        to="/"
        className="text-2xl font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        ChallengeMe
      </Link>

      <div className="hidden md:flex items-center gap-6">
        {user ? (
          <>
            <Link
              to="/dashboard"
              className="text-gray-200 hover:text-indigo-400 transition-colors"
            >
              Dashboard
            </Link>
            {hasMessages && (
              <Link
                to="/messages"
                className="text-gray-200 hover:text-indigo-400 transition-colors"
              >
                Messages
              </Link>
            )}
            <Link
              to="/profile"
              className="text-gray-200 hover:text-indigo-400 transition-colors"
            >
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="text-gray-200 hover:text-red-400 transition-colors flex items-center gap-2"
            >
              <FaSignOutAlt /> Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="text-gray-200 hover:text-indigo-400 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>

      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="md:hidden text-gray-200 hover:text-indigo-400 p-2"
        aria-label="Toggle navigation menu"
      >
        {isMenuOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
      </button>

      {isMenuOpen && (
        <motion.div
          className="md:hidden absolute top-16 left-0 right-0 bg-gray-800 border-t border-gray-700 shadow-lg px-4 py-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div className="flex flex-col gap-4 items-center">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-200 hover:text-indigo-400"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                {hasMessages && (
                  <Link
                    to="/messages"
                    className="text-gray-200 hover:text-indigo-400"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Messages
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="text-gray-200 hover:text-indigo-400"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="text-gray-200 hover:text-red-400 flex items-center gap-2"
                >
                  <FaSignOutAlt /> Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-200 hover:text-indigo-400"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 w-full text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}