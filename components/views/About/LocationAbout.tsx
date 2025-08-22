import Image from "next/image";

const LocationAbout = () => {
  return (
    <>
      {/* Bottom Layer: Logo Mouse Tracker */}
      
      {/* Content with 80% faded white background */}
      <div className="relative z-10" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
        {/* Top Layer: Content and Text */}
        <div className="flex flex-col gap-8 relative z-20 p-6 rounded-lg">
          <h2 className="text-4xl font-semibold relative z-20">Our Location</h2>

          <div className="text-2xl w-full relative z-20">
            <div className="relative h-80 sm:h-96 overflow-hidden max-w-[1200px] mx-auto">
              <a
                href="https://maps.app.goo.gl/GDwwS9JjkjVnNK1BA"
                target="_blank"
                rel="noreferrer"
                className="block w-full h-full"
              >
                <Image
                  width={1200}
                  height={600}
                  className="object-cover object-center w-full h-full"
                  alt="Map"
                  src={`${process.env.NEXT_PUBLIC_BASE_URL || ''}/map.png`}
                  quality={100}
                  priority
                  unoptimized
                />
              </a>

              <div className="absolute top-0 left-0 p-8 sm:p-16 flex items-center h-full pointer-events-none z-30">
                <div className="backdrop-blur-3xl p-8 sm:p-12 font-normal text-white shadow-xl rounded-2xl text-2xl sm:text-3xl">
                  44a Murrell Street, <br /> Wangaratta, <br /> Victoria 3677,
                  Australia
                  <br />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LocationAbout;