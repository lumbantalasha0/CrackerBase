import React from 'react';

export default function ResponsiveExample() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-3">Responsive Example</h2>

      {/*
        Responsive grid:
        - mobile (default): 1 column
        - md (tablet): 2 columns
        - lg (desktop): 3 columns
      */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-muted rounded shadow-sm">Item 1</div>
        <div className="p-4 bg-muted rounded shadow-sm">Item 2</div>
        <div className="p-4 bg-muted rounded shadow-sm">Item 3</div>
        <div className="p-4 bg-muted rounded shadow-sm">Item 4</div>
        <div className="p-4 bg-muted rounded shadow-sm">Item 5</div>
        <div className="p-4 bg-muted rounded shadow-sm">Item 6</div>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        Tip: Use responsive utility classes like <code>text-sm md:text-lg</code> or
        <code>w-full md:w-1/2</code> to adapt typography and layout across breakpoints.
      </p>
    </div>
  );
}
