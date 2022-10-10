const BannerHome = () => {
  return (
    <div className="wrapper  w-full px-8     md:px-12 mb-10  border">
      <div className="   mx-auto w-full py-5  sm:p-10 flex flex-col gap-8  sm:flex-row  items-center justify-between  ">
        <h2 className="text-3xl sm:text-4xl font-semibold sm:font-bold  text-black">
          Book an On Site Appointment
        </h2>
        <div className="flex gap-4 w-full sm:w-auto">
          <button className=" py-2.5 px-4 w-full sm:w-auto whitespace-nowrap">
            Book Now{" "}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BannerHome;
