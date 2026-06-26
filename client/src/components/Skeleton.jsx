import React from 'react';

const Skeleton = ({ className = '', style = {} }) => {
  return (
    <div
      className={`animate-pulse bg-[var(--glass-border)] rounded ${className}`}
      style={style}
    ></div>
  );
};

export const TableSkeleton = ({ rows = 5, columns = 5 }) => {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i}>
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rIdx) => (
            <tr key={rIdx}>
              {Array.from({ length: columns }).map((_, cIdx) => (
                <td key={cIdx}>
                  <Skeleton className="h-5 w-full max-w-[120px]" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Skeleton;
