import useLabelApi from './api/TaskLabels';
import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { useParams } from 'react-router-dom';
import { setLabels } from './slices/boardSlice';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormField, FormControl, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { RadioGroup } from '@/components/ui/radio-group';
import { RadioGroupItem } from '@radix-ui/react-radio-group';
import { Label } from '@/components/ui/label';
import { predefinedColors } from './constants/PredefinedColors';
import type { TaskLabel } from '@/modules/board/types/TaskLabel';
import TaskBadge from './components/TaskBadge';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string(),
  color: z.string(),
  board_id: z.number(),
  label_id: z.number().nullable(),
});

const Labels = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const { index, storeLabel, updateLabel } = useLabelApi();
  const { labels } = useAppSelector((state) => state.board);
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const { t } = useTranslation();
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = false;

    if (isMounted) return;
    const fetchLabels = async () => {
      const resposne = await index(String(id));
      dispatch(setLabels(resposne));
      isMounted = true;
    };

    fetchLabels();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const defaultValues = {
    name: '',
    color: predefinedColors[0].hsl,
    board_id: Number(id),
    label_id: null,
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const [name, color] = form.watch(['name', 'color']);

  const resetToDefault = () => {
    form.reset({ ...defaultValues });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (editMode && values.label_id) {
      await handleEdit(values);
    } else {
      await handleStore(values);
    }
  };

  const handleEdit = async (payload: z.infer<typeof formSchema>) => {
    try {
      const { label_id, ...rest } = payload;
      const response = await updateLabel({ ...rest }, String(label_id));
      dispatch(
        setLabels(
          labels.map((label) => {
            if (label.id === response.id) {
              return { ...label, color: response.color, name: response.name };
            } else {
              return label;
            }
          })
        )
      );
      closeDialog();
      setEditMode(false);
      resetToDefault();
    } catch (error) {
      if (error instanceof Error) {
        toast({
          description: t('label.error.edit'),
          variant: 'destructive',
        });
      }
    }
  };

  const handleStore = async (payload: z.infer<typeof formSchema>) => {
    try {
      const response = await storeLabel(payload);
      dispatch(setLabels([...labels, response]));
      closeDialog();
      resetToDefault();
    } catch (error) {
      if (error instanceof Error) {
        toast({
          description: t('label.error.create'),
          variant: 'destructive',
        });
      }
    }
  };

  const openDialog = (payload: TaskLabel) => {
    form.reset({
      ...payload,
      label_id: payload.id,
    });
    setEditMode(true);
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    resetToDefault();
  };

  const onOpenChange = (state: boolean) => {
    setOpen(state);
    if (!state) {
      resetToDefault();
    }
  };

  return (
    <div className="container p-8">
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
      >
        <DialogTrigger asChild>
          <Button>{t('label.create')}</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader className="space-y-4">
            <DialogTitle>{t('label.create')}</DialogTitle>
            <TaskBadge
              className="w-min"
              color={color}
              name={name.length ? name : t('label.preview')}
            />
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="w-full space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="text"
                        {...field}
                        placeholder={t('label.form.name')}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-6 gap-2"
                      >
                        {predefinedColors.map((color, index) => (
                          <div key={index}>
                            <RadioGroupItem
                              value={color.hsl}
                              id={`color-${index}`}
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor={`color-${index}`}
                              className="flex h-4 w-4 rounded-md border-2 p-4 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                              style={{ backgroundColor: color.hsl }}
                            />
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button onClick={() => form.handleSubmit(onSubmit)}>
                {t('general.submit')}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div>
        <table className="w-full border border-collapse">
          <tr className="border">
            <th
              className="border p-2"
              align="left"
            >
              Etykieta
            </th>
            <th
              className="border p-2"
              align="right"
            >
              Akcje
            </th>
          </tr>

          {labels.map((label) => (
            <tr
              key={label.id}
              className="w-full border"
            >
              <td className="border p-2">
                <TaskBadge
                  color={label.color}
                  name={label.name}
                />
              </td>
              <td
                align="right"
                className="border p-2"
              >
                <div className="space-x-2">
                  <Button
                    size="sm"
                    className="rounded-s"
                    onClick={() => openDialog(label)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-s"
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </table>
      </div>
    </div>
  );
};

export default Labels;