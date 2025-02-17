import Image from "next/image";

const HeroAbout = () => {
  return (
    <div className="  aspect-video relative lg:w-2/3 ">
      <Image 
        alt="team" 
        layout="fill" 
        objectFit="cover" 
        src={`${process.env.NEXT_PUBLIC_BASE_URL || ''}/About.jpeg`}
        loader={({ src }) => src}
        quality={100}
      />
    </div>
  );
};

export default HeroAbout;
