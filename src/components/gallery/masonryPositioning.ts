import {
  CellMeasurerCache,
  createMasonryCellPositioner,
  type Positioner,
} from "react-virtualized";

type FooterPositionerParams = {
  cellMeasurerCache: CellMeasurerCache;
  columnCount: number;
  columnWidth: number;
  footerIndex: number;
  spacer: number;
};

function getFooterTop({
  cellMeasurerCache,
  columnCount,
  footerIndex,
  spacer,
}: Pick<
  FooterPositionerParams,
  "cellMeasurerCache" | "columnCount" | "footerIndex" | "spacer"
>) {
  const columnHeights = Array.from({ length: columnCount }, () => 0);

  for (let index = 0; index < footerIndex; index += 1) {
    let shortestColumnIndex = 0;

    for (
      let columnIndex = 1;
      columnIndex < columnHeights.length;
      columnIndex += 1
    ) {
      if (columnHeights[columnIndex] < columnHeights[shortestColumnIndex]) {
        shortestColumnIndex = columnIndex;
      }
    }

    columnHeights[shortestColumnIndex] +=
      cellMeasurerCache.getHeight(index, 0) + spacer;
  }

  return Math.max(...columnHeights);
}

export function createFooterPositioner({
  cellMeasurerCache,
  columnCount,
  columnWidth,
  footerIndex,
  spacer,
}: FooterPositionerParams): Positioner {
  const imagePositioner = createMasonryCellPositioner({
    cellMeasurerCache,
    columnCount,
    columnWidth,
    spacer,
  });

  const positioner = ((index: number) => {
    if (index !== footerIndex) {
      return imagePositioner(index);
    }

    return {
      left: 0,
      top: getFooterTop({
        cellMeasurerCache,
        columnCount,
        footerIndex,
        spacer,
      }),
    };
  }) as Positioner;

  positioner.reset = (params) => {
    imagePositioner.reset(params);
  };

  return positioner;
}
