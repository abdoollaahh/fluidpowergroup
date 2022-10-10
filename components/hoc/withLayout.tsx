/* eslint-disable react/display-name */
import { FC } from "react";
import { Children } from "types/general";
import Layout from "../modules/Layout";

interface ILayoutProps {
  children: Children;
}
const withLayout = (Component: FC) => {
  const Wrapper = () => (
    <Layout>
      <Component/>
    </Layout>
  );

  return Wrapper;
};

export default withLayout;
