import Image from "next/image";

const HeroAbout = () => {
  return (
    <div className="  aspect-video relative lg:w-2/3 ">
      <Image
        alt="team"
        layout="fill"
        objectFit="cover"
        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80"
      />
    </div>
  );
};

export default HeroAbout;
