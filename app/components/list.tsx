import update from "immutability-helper";
import { useCallback, useEffect, useState } from "react";
import { useDrop } from "react-dnd";
import { useDebounce } from "~/hooks/useDebounce";
import type { WorkoutList, WorkoutOrder } from "~/types/routine";
import { Card } from "./card";
import { ItemTypes } from "./item-types";

export interface ContainerState {
  cards: any[];
}

export function List({
  items,
  order,
  setOrder,
  onChange,
  onDelete,
}: {
  items: WorkoutList[];
  order: WorkoutOrder;
  setOrder: (order: WorkoutOrder) => void;
  onChange: () => void;
  onDelete: (id: string) => void;
}) {
  const [cards, setCards] = useState<WorkoutList[]>(items);
  const [changeFlag, setChangeFlag] = useState(0);

  const debouncedChangeFlag: any = useDebounce<any>(changeFlag, 1500);
  useEffect(
    () => {
      if (changeFlag > 0) {
        onChange();
        setChangeFlag(0);
      } else {
        setChangeFlag(0);
      }
    },
    [debouncedChangeFlag] // Only call effect if debounced search term changes
  );

  useEffect(() => {
    setCards(items);
  }, [items]);

  const findCard = useCallback(
    (id: string) => {
      const card = cards.filter((c) => (!c ? false : `${c.id}` === id))[0] as {
        id: string;
        text: string;
      };
      return {
        card,
        index: cards.indexOf(card),
      };
    },
    [cards]
  );

  const moveCard = useCallback(
    (id: string, atIndex: number) => {
      const { card, index } = findCard(id);
      const nextCards = update(cards, {
        $splice: [
          [index, 1],
          [atIndex, 0, card],
        ],
      });
      setCards(nextCards);
      const nextWorkoutOrder = { ...order };
      nextCards.map((card, i) => {
        nextWorkoutOrder[card.id] = i;
      });
      setOrder(nextWorkoutOrder);
      setChangeFlag(changeFlag + 1);
    },
    [findCard, cards, setCards]
  );

  const [, drop] = useDrop(() => ({ accept: ItemTypes.CARD }));
  return (
    <div ref={drop} className="dnd-list">
      {cards.map((card) =>
        !card ? null : (
          <Card
            key={card.id}
            id={`${card.id}`}
            text={card.text}
            moveCard={moveCard}
            onDelete={onDelete}
            findCard={findCard}
          />
        )
      )}
    </div>
  );
}
