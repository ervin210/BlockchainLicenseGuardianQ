import { Card, CardContent } from "@/components/ui/card";

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: number;
  change: {
    value: number;
    isPositive: boolean;
  };
  bgColor: string;
  textColor: string;
};

export default function StatsCard({
  icon,
  label,
  value,
  change,
  bgColor,
  textColor,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-full ${bgColor} ${textColor} mr-4`}>
            {icon}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold">{value.toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center text-sm">
            <span className={`flex items-center ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {change.isPositive ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              {Math.abs(change.value)}%
            </span>
            <span className="text-muted-foreground ml-2">from last month</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
