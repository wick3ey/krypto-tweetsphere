
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link to="/">
            <Button className="w-full">
              Tillbaka till hemsidan
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="w-full mt-2 sm:mt-0"
            onClick={() => window.history.back()}
          >
            <X className="mr-2 h-4 w-4" />
            Stäng
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
