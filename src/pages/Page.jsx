import { useParams } from "react-router-dom";

function Page() {
  const { slug } = useParams();

  return (
    <div>
      <h2>Page: {slug}</h2>
      <p>This is where password logic will go.</p>
    </div>
  );
}

export default Page;
