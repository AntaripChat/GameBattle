import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { db, realtimeDb } from "../services/firebase";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { ref, onValue, push, serverTimestamp } from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";
import { FaPaperPlane, FaTimes } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";

export default function Messages() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "challenges"),
      where("userId", "==", user.uid)
    );
    const q2 = query(collection(db, "challenges"));

    const unsub1 = onSnapshot(q, (snapshot) => {
      const challengeData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setChallenges((prev) => [...prev.filter((c) => c.userId !== user.uid), ...challengeData]);
    }, (error) => {
      console.error("Error fetching created challenges:", error);
    });

    const unsub2 = onSnapshot(q2, (snapshot) => {
      const challengeData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((challenge) =>
          challenge.acceptedBy?.some((entry) => entry.userId === user.uid)
        );
      setChallenges((prev) => [...new Set([...prev, ...challengeData])]);
    }, (error) => {
      console.error("Error fetching accepted challenges:", error);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [user]);

  useEffect(() => {
    if (selectedChallenge) {
      setLoading(true);
      const messagesRef = ref(realtimeDb, `challengeGroups/${selectedChallenge.id}/messages`);
      const unsubscribe = onValue(messagesRef, async (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const messageList = await Promise.all(
            Object.entries(data).map(async ([key, value]) => {
              const userDocRef = doc(db, "users", value.userId);
              const userDocSnap = await getDoc(userDocRef);
              const userName = userDocSnap.exists() ? userDocSnap.data().name || "Anonymous" : "Anonymous";
              return {
                id: key,
                ...value,
                userName,
                createdAt: value.createdAt ? new Date(value.createdAt) : new Date(),
              };
            })
          );
          setMessages(messageList.sort((a, b) => a.createdAt - b.createdAt));
        } else {
          setMessages([]);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching messages:", error);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [selectedChallenge]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChallenge) return;
    try {
      const messagesRef = ref(realtimeDb, `challengeGroups/${selectedChallenge.id}/messages`);
      await push(messagesRef, {
        userId: user.uid,
        text: newMessage,
        createdAt: serverTimestamp(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    }
  };

  if (challenges.length === 0) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 p-4 sm:p-6 lg:p-8 pt-[96px] sm:pt-[104px] lg:pt-[112px] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center text-gray-300">
          <h3 className="text-xl font-medium mb-2 text-white">No Messages</h3>
          <p>Create or accept a challenge to start messaging!</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 p-4 sm:p-6 lg:p-8 pt-[96px] sm:pt-[104px] lg:pt-[112px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Messages</h1>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/3 bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Your Challenges</h2>
            <div className="space-y-2">
              {challenges.map((challenge) => (
                <motion.div
                  key={challenge.id}
                  className={`p-3 rounded-lg cursor-pointer ${
                    selectedChallenge?.id === challenge.id ? "bg-indigo-600" : "bg-gray-700"
                  }`}
                  onClick={() => setSelectedChallenge(challenge)}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  role="button"
                  aria-label={`Select ${challenge.gameName} challenge`}
                >
                  <p className="text-white font-medium">{challenge.gameName}</p>
                  <p className="text-sm text-gray-300">${challenge.prize}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="lg:w-2/3 bg-gray-800 rounded-xl p-4 border border-gray-700">
            {selectedChallenge ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    {selectedChallenge.gameName} Chat
                  </h2>
                  <button
                    onClick={() => setSelectedChallenge(null)}
                    className="text-gray-300 hover:text-white"
                    aria-label="Close chat"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
                <div className="h-[400px] overflow-y-auto mb-4 p-4 bg-gray-900 rounded-lg">
                  {loading ? (
                    <div className="text-center text-gray-300">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-300">No messages yet</div>
                  ) : (
                    <AnimatePresence>
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          className={`mb-4 ${
                            message.userId === user.uid ? "text-right" : "text-left"
                          }`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <p className="text-sm text-gray-400">
                            {message.userName} •{" "}
                            {message.createdAt instanceof Date && !isNaN(message.createdAt)
                              ? formatDistanceToNow(message.createdAt, { addSuffix: true })
                              : "Just now"}
                          </p>
                          <p
                            className={`inline-block p-3 rounded-lg ${
                              message.userId === user.uid
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-700 text-gray-200"
                            }`}
                          >
                            {message.text}
                          </p>
                        </motion.div>
                      ))}
                      <div ref={messagesEndRef} />
                    </AnimatePresence>
                  )}
                </div>
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-indigo-500"
                    placeholder="Type a message..."
                    aria-label="Type a message"
                  />
                  <motion.button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={!newMessage.trim()}
                    aria-label="Send message"
                  >
                    <FaPaperPlane className="w-4 h-4" />
                  </motion.button>
                </form>
              </>
            ) : (
              <div className="text-center text-gray-300">
                <p>Select a challenge to view messages</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}