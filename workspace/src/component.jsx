import React from "https://npm.tfl.dev/react";

import { ultraFetch } from "@ultra/react";

const component = () => {
  const data = ultraFetch("/api/hello");
  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default component;
