
import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import Svg, {
  Line,
  Ellipse,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg';

import { Meter, Note } from '../lib/rhythm';
import { onsetTicks, toTicks } from '../lib/trainer';

type Props = {
  notes: Note[];
  meter: Meter;
  activeIndex: number;
};

export default function RhythmStaff({
  notes,
  meter,
  activeIndex,
}: Props) {
  const positions = onsetTicks(notes);
  const width = Math.max(340, notes.length * 62 + 74);

  return (
    <View style={{ width: '100%' }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <Svg
          width={width}
          height={154}
          viewBox={`0 0 ${width} 154`}
        >
          {[30, 42, 54, 66, 78].map((y) => (
            <Line
              key={y}
              x1={16}
              x2={width - 16}
              y1={y}
              y2={y}
              stroke="#CBD5E1"
              strokeWidth="1.2"
            />
          ))}

          <Line
            x1={16}
            x2={16}
            y1={30}
            y2={78}
            stroke="#CBD5E1"
            strokeWidth="1.5"
          />

          <Line
            x1={width - 16}
            x2={width - 16}
            y1={30}
            y2={78}
            stroke="#CBD5E1"
            strokeWidth="2"
          />

          <SvgText
            x={25}
            y={48}
            fontSize={18}
            fontWeight="bold"
            fill="#E0F2FE"
          >
            {meter.split('/')[0]}
          </SvgText>

          <SvgText
            x={25}
            y={68}
            fontSize={18}
            fontWeight="bold"
            fill="#E0F2FE"
          >
            {meter.split('/')[1]}
          </SvgText>

          {positions.map(({ note, start }, i) => {
            const x = 68 + i * 62;
            const active = i === activeIndex;
            const color = active ? '#38BDF8' : '#F8FAFC';
            const half = note.duration === 2;
            const flagged = note.duration <= 0.5;
            const sixteenth = note.duration === 0.25;

            return (
              <React.Fragment key={`${note.id}-${i}`}>
                {active && (
                  <Rect
                    x={x - 19}
                    y={21}
                    width={42}
                    height={94}
                    rx={9}
                    fill="#164E63"
                  />
                )}

                {note.rest ? (
                  <Path
                    d={`M ${x - 5} 42 L ${x + 7} 42 L ${
                      x + 1
                    } 54 L ${x + 9} 54 L ${
                      x - 5
                    } 73 L ${x} 57 L ${x - 7} 57 Z`}
                    fill={color}
                  />
                ) : (
                  <>
                    <Ellipse
                      cx={x}
                      cy={60}
                      rx={10}
                      ry={7}
                      rotation={-20}
                      origin={`${x}, 60`}
                      fill={half ? '#1E293B' : color}
                      stroke={color}
                      strokeWidth="2"
                    />

                    <Line
                      x1={x + 9}
                      y1={59}
                      x2={x + 9}
                      y2={21}
                      stroke={color}
                      strokeWidth="2"
                    />

                    {flagged && (
                      <Path
                        d={`M ${x + 9} 21 Q ${
                          x + 33
                        } 30 ${x + 18} 45`}
                        fill="none"
                        stroke={color}
                        strokeWidth="2.5"
                      />
                    )}

                    {sixteenth && (
                      <Path
                        d={`M ${x + 9} 30 Q ${
                          x + 32
                        } 39 ${x + 18} 53`}
                        fill="none"
                        stroke={color}
                        strokeWidth="2.5"
                      />
                    )}

                    {note.duration === 1.5 && (
                      <Ellipse
                        cx={x + 19}
                        cy={60}
                        rx={2.5}
                        ry={2.5}
                        fill={color}
                      />
                    )}
                  </>
                )}

                <SvgText
                  x={x}
                  y={107}
                  textAnchor="middle"
                  fontSize={12}
                  fill={active ? '#7DD3FC' : '#CBD5E1'}
                >
                  {start / 4 + 1}
                </SvgText>

                <SvgText
                  x={x}
                  y={128}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#94A3B8"
                >
                  {toTicks(note.duration)}/4q
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </ScrollView>

      <Text
        style={{
          color: '#94A3B8',
          fontSize: 11,
          textAlign: 'center',
        }}
      >
        Single-pitch rhythm staff · quarter-note units
      </Text>
    </View>
  );
}
