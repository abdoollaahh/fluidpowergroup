import { motion } from "framer-motion";

const HighlightsAbout = () => {
  return (
    <motion.div className=" w-full  bg-slate-50/60">
      <div className="wrapper px-8 md:px-12 pt-8 pb-10 flex flex-col gap-8">
        <h2 className="text-4xl font-semibold">Highlights</h2>

        <motion.div className="grid grid-cols-4 gap-6 sm:gap-8">
          {Array(6)
            .fill({})
            .map((_, i) => (
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                viewport={{ once: true }}
                whileInView={{
                  opacity: 1,
                  x: 0,
                  transition: { delay: 0.4 * i, duration: 0.5 },
                }}
                className=" p-8 sm:p-10 xl:p-12 col-span-4 max-w-[20rem] sm:max-w-full mx-auto sm:col-span-2 lg:col-span-1  rounded-2xl bg-white shadow-2xl shadow-slate-200 flex flex-col  gap-4 "
                key={i}
              >
                <h3 className="font-bold text-5xl xl:text-6xl">
                  {" "}
                  {10 + i * 10}M+
                </h3>
                <h4 className="text-xl text-black/60">
                  Lorem ipsum dolor sit amet.
                </h4>
              </motion.div>
            ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default HighlightsAbout;
