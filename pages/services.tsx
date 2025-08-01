import db from "db";
import Image from "next/image";
import type { NextPage } from "next";

const Services: NextPage = () => {
  return (
    <div className="flex flex-col w-full">
      {/* Services Section - Moved from homepage */}
      <div className="bg-[#191919]">
        <div className="w-full wrapper text-black flex">
          <div className="h-full w-full">
            <div className="flex flex-col gap-4 p-8">
              <div className="text-2xl sm:text-3xl font-semibold text-yellow-600">
                Services
              </div>
              <div className="font-bold text-4xl sm:text-5xl text-yellow-500">
                What we provide
              </div>
            </div>

            {db.services_Bending.map((item, index) => (
              <div
                className="w-full p-7 sm:p-10 text-yellow-500 flex sm:flex-row flex-col gap-4 sm:gap-10 border-yellow-600 border-t-2 h-full hover:bg-[#151515] hover:shadow-lg hover:shadow-yellow-400/50 hover:text-yellow-400 cursor-pointer transition-all duration-200"
                key={index}
              >
                <div className="w-full h-48 sm:h-28 sm:w-48 bg-slate-200/20 border border-slate-200/10 overflow-hidden">
                  <Image 
                    src="/tubeBending.png" 
                    alt="Tube Bending" 
                    width={192}
                    height={112}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <div className="text-2xl sm:text-3xl font-semibold">{item}</div>
                  <div className="text-xl text-yellow-600 sm:text-2xl font-light opacity-75">
                    •Fully CNC Bending Machine <br />
                    • Hydraulic Tube Bending upto 28mm Diameter Tube <br />
                    • Bend Radius as tight as TWICE the Outside Diameter <br />
                    • Our machines accept STL (Tube 3D Model) & XYZ points <br />
                    • Accuracy upto ± 0.5mm & 0.15° <br />
                    • Bending capability of Metric as well as Imperial Tubes
                  </div>
                </div>
              </div>
            ))}

            {db.services_Flaring.map((item, index) => (
              <div
                className="w-full p-7 sm:p-10 text-yellow-500 flex sm:flex-row flex-col gap-4 sm:gap-10 border-yellow-600 border-t-2 h-full hover:bg-[#151515] hover:shadow-lg hover:shadow-yellow-400/50 hover:text-yellow-400 cursor-pointer transition-all duration-200"
                key={index}
              >
                <div className="w-full h-48 sm:h-28 sm:w-48 bg-slate-200/20 border border-slate-200/10 overflow-hidden">
                  <Image 
                    src="/tubeFlaring.png" 
                    alt="Tube Flaring" 
                    width={192}
                    height={112}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <div className="text-2xl sm:text-3xl font-semibold">{item}</div>
                  <div className="text-xl text-yellow-600 sm:text-2xl font-light opacity-75">
                    • JIC 37° Flaring of Imperial Tubes <br />
                    • JIC 37° Flaring of Metric Tubes with JIC Nuts & Sleeves <br />
                    • Tubes range from 3/8&quot; to 1&quot; OR 10mm to 28mm <br />
                    • Our Machines are the most updated and produce clean flares with high accuracy <br />
                    • Metric Tubes Cutting Ring Assembly<br />
                    • ORFS Ends Assembly
                  </div>
                </div>
              </div>
            ))}

            {db.services_Pressure.map((item, index) => (
              <div
                className="w-full p-7 sm:p-10 text-yellow-500 flex sm:flex-row flex-col gap-4 sm:gap-10 border-yellow-600 border-t-2 h-full hover:bg-[#151515] hover:shadow-lg hover:shadow-yellow-400/50 hover:text-yellow-400 cursor-pointer transition-all duration-200"
                key={index}
              >
                <div className="w-full h-48 sm:h-28 sm:w-48 bg-slate-200/20 border border-slate-200/10 overflow-hidden">
                  <Image 
                    src="/pressureTesting.png" 
                    alt="Pressure Testing" 
                    width={192}
                    height={112}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <div className="text-2xl sm:text-3xl font-semibold">{item}</div>
                  <div className="text-xl text-yellow-600 sm:text-2xl font-light opacity-75">
                    • Pressure Testing upto 15,000psi <br />
                    • Hydrostatic Pressure Testing of; • Hydraulic Valves • Hydraulic Hoses • Hydraulic Tubes • Hydraulic Manifold • Hydraulic Cylinders
                  </div>
                </div>
              </div>
            ))}

            {db.services_Assembly.map((item, index) => (
              <div
                className="w-full p-7 sm:p-10 text-yellow-500 flex sm:flex-row flex-col gap-4 sm:gap-10 border-yellow-600 border-t-2 h-full hover:bg-[#151515] hover:shadow-lg hover:shadow-yellow-400/50 hover:text-yellow-400 cursor-pointer transition-all duration-200"
                key={index}
              >
                <div className="w-full h-48 sm:h-28 sm:w-48 bg-slate-200/20 border border-slate-200/10 overflow-hidden">
                  <Image 
                    src="/hoseAssembly.png" 
                    alt="Hose Assembly" 
                    width={192}
                    height={112}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <div className="text-2xl sm:text-3xl font-semibold">{item}</div>
                  <div className="text-xl text-yellow-600 sm:text-2xl font-light opacity-75">
                    • We are equipped with the latest machines <br />
                    • Hose Crimping Upto 2&quot; Hose <br />
                    • Multi-Braid Hose Crimping <br />
                    • We have the capacity of handling large quantity of hose crimping and packing
                  </div>
                </div>
              </div>
            ))}

            {db.services_Cutting.map((item, index) => (
              <div
                className="w-full p-7 sm:p-10 text-yellow-500 flex sm:flex-row flex-col gap-4 sm:gap-10 border-yellow-600 border-t-2 h-full hover:bg-[#151515] hover:shadow-lg hover:shadow-yellow-400/50 hover:text-yellow-400 cursor-pointer transition-all duration-200"
                key={index}
              >
                <div className="w-full h-48 sm:h-28 sm:w-48 bg-slate-200/20 border border-slate-200/10 overflow-hidden">
                  <Image 
                    src="/laserCutting.jpg" 
                    alt="Laser Cutting" 
                    width={192}
                    height={112}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <div className="text-2xl sm:text-3xl font-semibold">{item}</div>
                  <div className="text-xl text-yellow-600 sm:text-2xl font-light opacity-75">
                    • We are equipped with the latest LASER cutting machines that can cut upto 12mm Stainless Steel and 16mm Carbon Steel
                  </div>
                </div>
              </div>
            ))}

            {db.services_Metal.map((item, index) => (
              <div
                className="w-full p-7 sm:p-10 text-yellow-500 flex sm:flex-row flex-col gap-4 sm:gap-10 border-yellow-600 border-t-2 h-full hover:bg-[#151515] hover:shadow-lg hover:shadow-yellow-400/50 hover:text-yellow-400 cursor-pointer transition-all duration-200"
                key={index}
              >
                <div className="w-full h-48 sm:h-28 sm:w-48 bg-slate-200/20 border border-slate-200/10 overflow-hidden">
                  <Image 
                    src="/metalBending.png" 
                    alt="Metal Bending" 
                    width={192}
                    height={112}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <div className="text-2xl sm:text-3xl font-semibold">{item}</div>
                  <div className="text-xl text-yellow-600 sm:text-2xl font-light opacity-75">
                    • We have the capability of bending complex shapes, long lengths and upto 16mm thick plates
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;