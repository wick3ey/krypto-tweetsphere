
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md p-6 bg-card border border-border rounded-xl shadow-lg">
        <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-6 flex items-center justify-center">
          <span className="text-4xl">404</span>
        </div>
        <h1 className="text-3xl font-bold mb-4">Sidan hittades inte</h1>
        <p className="text-muted-foreground mb-6">
          Vi kunde inte hitta sidan du letade efter. Den kan ha flyttats eller tagits bort.
        </p>
        <Link to="/">
          <Button className="w-full">
            Tillbaka till hemsidan
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
