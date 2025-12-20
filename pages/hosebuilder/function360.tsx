import { useRouter } from "next/router";
import { motion } from "framer-motion";

const Function360 = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-gray-100">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center px-8"
      >
        <div
          className="relative overflow-hidden p-12 rounded-3xl"
          style={{
            background: `
              radial-gradient(ellipse at center, 
                rgba(255, 255, 255, 0.5) 0%, 
                rgba(255, 255, 255, 0.3) 50%, 
                rgba(240, 240, 240, 0.4) 100%
              ),
              rgba(255, 255, 255, 0.3)
            `,
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.6)",
            boxShadow: `
              0 20px 50px rgba(0, 0, 0, 0.1),
              inset 0 2px 0 rgba(255, 255, 255, 0.8),
              inset 0 4px 15px rgba(255, 255, 255, 0.3)
            `,
          }}
        >
          {/* Glass shine effect */}
          <div
            style={{
              position: "absolute",
              top: "2px",
              left: "20px",
              right: "20px",
              height: "30%",
              background: "linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)",
              borderRadius: "30px 30px 20px 20px",
              pointerEvents: "none",
            }}
          />

          <motion.h1
            className="text-6xl font-bold mb-4"
            style={{ color: "#333" }}
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Function360
          </motion.h1>

          <motion.p
            className="text-2xl mb-8"
            style={{ color: "#666" }}
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Coming Soon
          </motion.p>

          <motion.p
            className="text-lg mb-8 max-w-md mx-auto"
            style={{ color: "#888" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Were working on something exciting. Stay tuned for updates!
          </motion.p>

          <motion.button
            onClick={() => router.push("/")}
            className="relative overflow-hidden"
            style={{
              all: "unset",
              cursor: "pointer",
              display: "inline-block",
              padding: "12px 32px",
              borderRadius: "40px",
              fontSize: "1rem",
              fontWeight: "600",
              color: "#000",
              textDecoration: "none",
              background: `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`,
              backdropFilter: "blur(15px)",
              border: "1px solid rgba(255, 215, 0, 0.9)",
              boxShadow: `
                0 10px 30px rgba(250, 204, 21, 0.5),
                inset 0 2px 0 rgba(255, 255, 255, 0.8),
                inset 0 3px 12px rgba(255, 255, 255, 0.4)
              `,
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px) scale(1.05)";
              e.currentTarget.style.boxShadow = `
                0 15px 40px rgba(250, 204, 21, 0.7),
                inset 0 2px 0 rgba(255, 255, 255, 0.9),
                inset 0 4px 15px rgba(255, 255, 255, 0.5)
              `;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0px) scale(1)";
              e.currentTarget.style.boxShadow = `
                0 10px 30px rgba(250, 204, 21, 0.5),
                inset 0 2px 0 rgba(255, 255, 255, 0.8),
                inset 0 3px 12px rgba(255, 255, 255, 0.4)
              `;
            }}
          >
            Return Home
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default Function360;