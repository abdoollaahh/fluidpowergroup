import withLayout from "@/hoc/withLayout";
import { FilterProducts, GridProducts, HeaderProducts } from "@/views/Products";
import { useEffect, useState } from "react";
import Header from "@/modules/Header";
import { useRouter } from "next/router";
import axios from "axios";
import Loading from "@/modules/Loading";
import { AnimatePresence, motion } from "framer-motion";

type searchParams = {
  title: string;
  categories: string[];
  subCategories: string[];
};

const SEARCHPARAMETERS = [
  {
    product: "Hose Fittings",
    categories: ["BSP", "JIC", "Metric", "ORFS", "Ferrules"],
    subCategories: [
      "MALE STRAIGHT",
      "FEMALE STRAIGHT",
      "45\u00B0",
      "90\u00B0",
      "BANJO",
    ],
  },
  {
    product: "Hydraulic Adaptors",
    categories: ["BSP", "JIC", "Metric", "ORFS", "Stainless Adaptors"],
    subCategories: ["MALE x MALE", "MALE x FEMALE"],
    extraParams: ["STRAIGHT", "45\u00B0", "90\u00B0", "TEE"],
  },
  {
    product: "Hydraulic Hoses",
    categories: ["Suction", "Hydraulic"],
    subCategories: [],
  },
  {
    product: "Steel Tubes",
    categories: ["Carbon Steel", "Stainless Steel"],
    subCategories: ["Metric", "Imperial"],
  },
];

const Search = () => {
  const router = useRouter();
  const [titles, setTitles] = useState<String[]>([]);
  const [categories, setCategories] = useState<searchParams[]>([]);
  const [data, setData] = useState<any>([]);
  const [filteredData, setFilteredData] = useState<any>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
const categories = async () => {
      const cat = await axios.get(
        `${process.env.NEXT_PUBLIC_BASEURL}/getAllProducts`
      );
      if (cat.data.categories.length !== 0) {
        if (cat.data.categories[0].subCategories.length !== 0) {
          if(cat.data.categories[0].subCategories[0].series.length !== 0) {
            return cat;  
          } else {
            await categories()
          }
        } else {
          await categories()
        }

      } else {
        await categories()
      }
    };

    categories().then((result: any) => {
      setData(result.data.categories);
      setLoading(false)
    });
  }, []);

  // useEffect(() => {
  //       const series = async () => {
  //     const series = await axios.post(
  //       `${process.env.NEXT_PUBLIC_BASEURL}/getAllSeries`,
  //       { data: { slug } }
  //     );
  //     return series;
  //   };

  //   series().then((result: any) => {
  //     setSeries(result.data.series);
  //   });
  // }, [slug]);

  const checkCategory = (product: string, category: string) => {
    const found = categories.find((cat) => cat.title === product);
    if (found) {
      return found.categories.includes(category);
    }
    return false;
  };

  const checkSubCategory = (product: string, subCategory: string) => {
    const found = categories.find((cat) => cat.title === product);
    if (found) {
      return found.subCategories.includes(subCategory);
    }
    return false;
  };

  const addCategory = (product: string, category: string) => {
    const found = categories.find((cat) => cat.title === product);
    if (found) {
      if (found.categories.includes(category)) {
        found.categories = found.categories.filter((cat) => cat !== category);
      } else {
        found.categories.push(category);
      }
    } else {
      categories.push({
        title: product,
        categories: [category],
        subCategories: [],
      });
    }
    setCategories([...categories]);
  };

  const addSubCategory = (product: string, subCategory: string) => {
    const found = categories.find((cat) => cat.title === product);
    if (found) {
      if (found.subCategories.includes(subCategory)) {
        found.subCategories = found.subCategories.filter(
          (cat) => cat !== subCategory
        );
      } else {
        found.subCategories.push(subCategory);
      }
    } else {
      categories.push({
        title: product,
        categories: [],
        subCategories: [subCategory],
      });
    }
    setCategories([...categories]);
  };

  useEffect(() => {
    let newFilteredData: any[] = [];

    categories.forEach((category) => {
      const found = data.find((cat: any) => cat.title === category.title);
      category.categories.forEach((cat) => {
        const foundCategory = found.subCategories.find(
          (c: any) => c.title === cat
        );
        if (category.subCategories.length > 0) {
          foundCategory.series.forEach((series: any) => {
            category.subCategories.forEach((subCat) => {
              if (series.description.includes(subCat)) {
                newFilteredData.push(series);
              }
            });
          });
        } else {
          newFilteredData.push(...foundCategory.series);
        }
      });
    });
    console.log(newFilteredData);
    setFilteredData(newFilteredData);
  }, [categories]);

  const variants = {
    initial: { opacity: 0, x: -100 },
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, staggerChildren: 0.5 },
    },
    exit: { opacity: 0, y: -100, transition: { duration: 0.3 } },
  };

  if (loading) {
    return (
      <Loading />
    )
  }

  return (
    <div className="px-8 md:px-12   py-12 min-h-screen">
      <div className="text-[4rem] md:text-[6rem] lg:text-[8rem] xl:text-[10rem] font-bold text-slate-200/50">
        Search
      </div>
      <div className="wrapper flex flex-col gap-12 items-center px-10">
        <div className="w-full p-5 px-8 rounded-md shadow-lg hover:shadow-xl transition duration-200">
          <div>
            <div>
              {SEARCHPARAMETERS.map((product, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row justify-start items-start my-2"
                >
                  <div
                    className="w-[30%] max-w-[200px]"
                    onClick={() => {
                      if (titles.includes(product.product)) {
                        setTitles(
                          titles.filter((title) => title !== product.product)
                        );
                      } else {
                        setTitles([...titles, product.product]);
                      }
                    }}
                  >
                    <span
                      className={`text-lg font-bold ${
                        titles.includes(product.product)
                          ? "text-primary"
                          : "text-slate-700"
                      } cursor-pointer`}
                    >
                      {product.product}
                    </span>
                  </div>
                  {titles.includes(product.product) && (
                    <AnimatePresence>
                      <div>
                        <motion.div
                          variants={variants}
                          initial={"initial"}
                          animate={"animate"}
                          exit={"exit"}
                          transition={{ duration: 0.5, staggerChildren: 0.5 }}
                        >
                          <div>
                            <span className="text-md font-bold text-black">
                              Categories
                            </span>
                            <motion.div className="flex mt-2 flex-wrap">
                              {product.categories.map((category, index) => (
                                <div
                                  className={`border-2 rounded-xl mr-4 px-4 py-1 flex justify-center items-center my-2 hover:cursor-pointer
                                  ${
                                    checkCategory(product.product, category)
                                      ? "border-primary text-primary"
                                      : "border-slate-700"
                                  }
                                  `}
                                  key={index}
                                  onClick={() => {
                                    addCategory(product.product, category);
                                  }}
                                >
                                  {category}
                                </div>
                              ))}
                            </motion.div>
                          </div>
                          <div className="mt-2">
                            <span className="text-md font-bold text-black">
                              {product.subCategories.length > 0 &&
                                "Sub-Categories"}
                            </span>
                            <div className="flex mt-2 flex-wrap mb-5">
                              {product.subCategories.map(
                                (subCategory, index) => (
                                  <div
                                    className={`
                                  border-2 rounded-xl mr-4 mt-2 px-4 py-1 flex justify-center items-center hover:cursor-pointer
                                  ${
                                    checkSubCategory(
                                      product.product,
                                      subCategory
                                    )
                                      ? "border-primary text-primary"
                                      : "border-slate-700"
                                  }
                                  `}
                                    key={index}
                                    onClick={() => {
                                      addSubCategory(
                                        product.product,
                                        subCategory
                                      );
                                    }}
                                  >
                                    {subCategory}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                          {product.extraParams && (
                            <div className="mt-2">
                              <span className="text-md font-bold text-black">
                                {"Parameters"}
                              </span>
                              <div className="flex mt-2 flex-wrap mb-5">
                                {product.extraParams.map((params, index) => (
                                  <div
                                    className={`border-2 rounded-xl mr-4 mt-2 px-4 py-1 flex justify-center items-center hover:cursor-pointer
                                    ${
                                      checkSubCategory(product.product, params)
                                        ? "border-primary text-primary"
                                        : "border-slate-700"
                                    }`}
                                    key={index}
                                    onClick={() => {
                                      addSubCategory(product.product, params);
                                    }}
                                  >
                                    {params}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      </div>
                    </AnimatePresence>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <motion.div className="p-10">
        <GridProducts
          seriesList={filteredData}
          showDescription={Boolean(false)}
        />
      </motion.div>
    </div>
  );
};

export default Search;
