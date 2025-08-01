import Image from "next/image";

const HeroAbout = () => {
  return (
    <div className="aspect-video relative lg:w-2/3 overflow-hidden rounded-lg">
      <Image 
        alt="team" 
        width={800}
        height={450}
        className="object-cover w-full h-full"
        src={`${process.env.NEXT_PUBLIC_BASE_URL || ''}/About.jpeg`}
        quality={100}
        priority
        unoptimized
      />
    </div>
  );
};

export default HeroAbout;